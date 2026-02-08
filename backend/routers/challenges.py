from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List
from datetime import datetime, timezone, timedelta
import secrets
import string
from core.supabase_client import get_supabase
from schemas.challenges import (
    ChallengeCreate,
    ChallengeResponse,
    ChallengeAccept,
    ChallengeProgressUpdate,
    ChallengeProgressResponse,
    ChallengeWithProgress,
    ChallengeStatus,
)

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


def get_user_id(authorization: str = Header(...)) -> str:
    """Extract user ID from the Authorization header (Bearer token)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    supabase = get_supabase()
    
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


def get_profile_by_id(supabase, user_id: str):
    """Helper to get a profile by user ID."""
    result = supabase.table("profiles").select("id, username, display_name, avatar_url").eq("id", user_id).execute()
    return result.data[0] if result.data else None


@router.post("", response_model=ChallengeResponse)
def create_challenge(
    challenge: ChallengeCreate,
    user_id: str = Depends(get_user_id)
):
    """Create a new challenge and send it to an opponent."""
    supabase = get_supabase()
    
    # Get challenger profile
    challenger_profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not challenger_profile.data:
        raise HTTPException(status_code=400, detail="You must create a profile first")
    
    # Find opponent by username
    opponent = supabase.table("profiles")\
        .select("*")\
        .eq("username", challenge.opponent_username.lower())\
        .execute()
    
    if not opponent.data:
        raise HTTPException(status_code=404, detail=f"User @{challenge.opponent_username} not found")
    
    opponent_id = opponent.data[0]["id"]
    
    if opponent_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot challenge yourself")
    
    # Validate deadline is in the future
    if challenge.deadline <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Deadline must be in the future")
    
    # Calculate response deadline
    response_days = challenge.response_days or 3
    if response_days not in (1, 3, 7):
        response_days = 3
    response_deadline = datetime.now(timezone.utc) + timedelta(days=response_days)

    # Create the challenge
    data = {
        "challenger_id": user_id,
        "opponent_id": opponent_id,
        "challenger_skill": challenge.challenger_skill,
        "opponent_skill": challenge.opponent_skill,
        "deadline": challenge.deadline.isoformat(),
        "message": challenge.message,
        "status": ChallengeStatus.PENDING.value,
        "response_deadline": response_deadline.isoformat(),
    }
    
    result = supabase.table("challenges").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create challenge")
    
    challenge_data = result.data[0]
    
    # Add profile info
    challenge_data["challenger"] = get_profile_by_id(supabase, user_id)
    challenge_data["opponent"] = opponent.data[0]
    
    # Create notification for opponent
    supabase.table("notifications").insert({
        "user_id": opponent_id,
        "type": "challenge_received",
        "title": f"New challenge from @{challenger_profile.data[0]['username']}!",
        "message": f"They want to challenge you to learn {challenge.opponent_skill}",
        "data": {"challenge_id": challenge_data["id"]},
    }).execute()
    
    return challenge_data


@router.get("", response_model=List[ChallengeWithProgress])
def get_my_challenges(
    status: str = None,
    user_id: str = Depends(get_user_id)
):
    """Get all challenges for the current user."""
    supabase = get_supabase()
    
    # Build query
    query = supabase.table("challenges")\
        .select("*")\
        .or_(f"challenger_id.eq.{user_id},opponent_id.eq.{user_id}")\
        .order("created_at", desc=True)
    
    if status:
        query = query.eq("status", status)
    
    result = query.execute()
    
    challenges_with_progress = []
    now = datetime.now(timezone.utc)

    for ch in result.data or []:
        # Auto-expire pending challenges past their response deadline
        if ch["status"] == "pending" and ch.get("response_deadline"):
            try:
                rd = datetime.fromisoformat(ch["response_deadline"].replace("Z", "+00:00"))
                if rd < now:
                    supabase.table("challenges").update(
                        {"status": "expired"}
                    ).eq("id", ch["id"]).execute()
                    ch["status"] = "expired"
            except (ValueError, TypeError):
                pass

        # Get profiles
        ch["challenger"] = get_profile_by_id(supabase, ch["challenger_id"])
        ch["opponent"] = get_profile_by_id(supabase, ch["opponent_id"])
        
        # Get progress for both participants
        progress_result = supabase.table("challenge_progress")\
            .select("*")\
            .eq("challenge_id", ch["id"])\
            .execute()
        
        my_progress = None
        opponent_progress = None
        
        for p in progress_result.data or []:
            if p["user_id"] == user_id:
                my_progress = p
            else:
                opponent_progress = p
        
        challenges_with_progress.append({
            "challenge": ch,
            "my_progress": my_progress,
            "opponent_progress": opponent_progress,
        })
    
    return challenges_with_progress


@router.get("/{challenge_id}", response_model=ChallengeWithProgress)
def get_challenge(
    challenge_id: str,
    user_id: str = Depends(get_user_id)
):
    """Get a specific challenge with progress."""
    supabase = get_supabase()
    
    result = supabase.table("challenges").select("*").eq("id", challenge_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    ch = result.data[0]
    
    # Check user is part of this challenge
    if ch["challenger_id"] != user_id and ch["opponent_id"] != user_id:
        raise HTTPException(status_code=403, detail="You are not part of this challenge")
    
    # Get profiles
    ch["challenger"] = get_profile_by_id(supabase, ch["challenger_id"])
    ch["opponent"] = get_profile_by_id(supabase, ch["opponent_id"])
    
    # Get progress
    progress_result = supabase.table("challenge_progress")\
        .select("*")\
        .eq("challenge_id", challenge_id)\
        .execute()
    
    my_progress = None
    opponent_progress = None
    
    for p in progress_result.data or []:
        if p["user_id"] == user_id:
            my_progress = p
        else:
            opponent_progress = p
    
    return {
        "challenge": ch,
        "my_progress": my_progress,
        "opponent_progress": opponent_progress,
    }


@router.post("/{challenge_id}/respond", response_model=ChallengeResponse)
def respond_to_challenge(
    challenge_id: str,
    response: ChallengeAccept,
    user_id: str = Depends(get_user_id)
):
    """Accept or decline a challenge."""
    supabase = get_supabase()
    
    # Get challenge
    result = supabase.table("challenges").select("*").eq("id", challenge_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    ch = result.data[0]
    
    # Only opponent can respond
    if ch["opponent_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the challenged user can respond")
    
    if ch["status"] != ChallengeStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Challenge is no longer pending")

    # Check if response deadline has passed
    if ch.get("response_deadline"):
        try:
            rd = datetime.fromisoformat(ch["response_deadline"].replace("Z", "+00:00"))
            if rd < datetime.now(timezone.utc):
                supabase.table("challenges").update(
                    {"status": "expired"}
                ).eq("id", ch["id"]).execute()
                raise HTTPException(status_code=400, detail="Response deadline has passed. This challenge has expired.")
        except (ValueError, TypeError):
            pass

    new_status = ChallengeStatus.ACTIVE.value if response.accept else ChallengeStatus.DECLINED.value
    
    # Update challenge status
    update_result = supabase.table("challenges")\
        .update({"status": new_status})\
        .eq("id", challenge_id)\
        .execute()
    
    if response.accept:
        # Create progress records for both participants
        progress_data = [
            {
                "challenge_id": challenge_id,
                "user_id": ch["challenger_id"],
                "skill_name": ch["challenger_skill"],
            },
            {
                "challenge_id": challenge_id,
                "user_id": ch["opponent_id"],
                "skill_name": ch["opponent_skill"],
            }
        ]
        supabase.table("challenge_progress").insert(progress_data).execute()
        
        # Notify challenger
        supabase.table("notifications").insert({
            "user_id": ch["challenger_id"],
            "type": "challenge_accepted",
            "title": "Challenge accepted! 🎉",
            "message": "Your challenge has been accepted. Game on!",
            "data": {"challenge_id": challenge_id},
        }).execute()
    else:
        # Notify challenger of decline
        supabase.table("notifications").insert({
            "user_id": ch["challenger_id"],
            "type": "challenge_declined",
            "title": "Challenge declined",
            "message": "Your challenge was declined.",
            "data": {"challenge_id": challenge_id},
        }).execute()
    
    updated = update_result.data[0]
    updated["challenger"] = get_profile_by_id(supabase, ch["challenger_id"])
    updated["opponent"] = get_profile_by_id(supabase, ch["opponent_id"])
    
    return updated


@router.post("/{challenge_id}/checkin", response_model=ChallengeProgressResponse)
def daily_checkin(
    challenge_id: str,
    checkin: ChallengeProgressUpdate,
    user_id: str = Depends(get_user_id)
):
    """Record a daily check-in for a challenge."""
    supabase = get_supabase()
    
    # Get challenge
    challenge = supabase.table("challenges").select("*").eq("id", challenge_id).execute()
    
    if not challenge.data:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    ch = challenge.data[0]
    
    if ch["status"] != ChallengeStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Challenge is not active")
    
    # Get user's progress
    progress = supabase.table("challenge_progress")\
        .select("*")\
        .eq("challenge_id", challenge_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not progress.data:
        raise HTTPException(status_code=404, detail="Progress record not found")
    
    current = progress.data[0]
    
    # Update progress
    completed_days = current["completed_days"] + (1 if checkin.completed else 0)
    completion_percentage = (completed_days / current["total_days"]) * 100
    
    # Add to daily log
    daily_log = current.get("daily_log") or []
    daily_log.append({
        "day": len(daily_log) + 1,
        "completed": checkin.completed,
        "notes": checkin.notes,
        "date": datetime.now(timezone.utc).isoformat(),
    })
    
    update_data = {
        "completed_days": completed_days,
        "completion_percentage": completion_percentage,
        "last_checkin": datetime.now(timezone.utc).isoformat(),
        "daily_log": daily_log,
    }
    
    result = supabase.table("challenge_progress")\
        .update(update_data)\
        .eq("id", current["id"])\
        .execute()
    
    # Notify opponent of progress
    opponent_id = ch["opponent_id"] if ch["challenger_id"] == user_id else ch["challenger_id"]
    user_profile = get_profile_by_id(supabase, user_id)
    
    supabase.table("notifications").insert({
        "user_id": opponent_id,
        "type": "opponent_progress",
        "title": f"@{user_profile['username']} checked in!",
        "message": f"Day {len(daily_log)} - {'Completed' if checkin.completed else 'Logged'}",
        "data": {"challenge_id": challenge_id},
    }).execute()
    
    # Check if challenge should complete (deadline passed or both at 100%)
    # This could be moved to a background job
    
    return result.data[0]


@router.post("/{challenge_id}/give-up")
def give_up_challenge(
    challenge_id: str,
    user_id: str = Depends(get_user_id)
):
    """Give up on an active challenge. The opponent continues solo."""
    supabase = get_supabase()

    result = supabase.table("challenges").select("*").eq("id", challenge_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Challenge not found")

    ch = result.data[0]

    if ch["status"] != "active":
        raise HTTPException(status_code=400, detail="Can only give up on active challenges")

    if ch["challenger_id"] != user_id and ch["opponent_id"] != user_id:
        raise HTTPException(status_code=403, detail="You are not part of this challenge")

    # Delete the quitter's progress record
    supabase.table("challenge_progress")\
        .delete()\
        .eq("challenge_id", challenge_id)\
        .eq("user_id", user_id)\
        .execute()

    # Check if the opponent still has progress - if so, challenge stays active for them
    opponent_id = ch["opponent_id"] if ch["challenger_id"] == user_id else ch["challenger_id"]
    opponent_progress = supabase.table("challenge_progress")\
        .select("id")\
        .eq("challenge_id", challenge_id)\
        .eq("user_id", opponent_id)\
        .execute()

    if not opponent_progress.data:
        # Both gave up, mark as cancelled
        supabase.table("challenges").update(
            {"status": ChallengeStatus.CANCELLED.value}
        ).eq("id", challenge_id).execute()

    # Notify the opponent
    user_profile = get_profile_by_id(supabase, user_id)
    username = user_profile["username"] if user_profile else "Someone"

    supabase.table("notifications").insert({
        "user_id": opponent_id,
        "type": "opponent_gave_up",
        "title": f"@{username} gave up on the challenge",
        "message": "You can continue learning on your own!",
        "data": {"challenge_id": challenge_id},
    }).execute()

    return {"message": "You gave up on the challenge. Your opponent can continue."}


@router.post("/{challenge_id}/withdraw")
def withdraw_challenge(
    challenge_id: str,
    user_id: str = Depends(get_user_id)
):
    """Withdraw a pending challenge (only the challenger can do this)."""
    supabase = get_supabase()

    result = supabase.table("challenges").select("*").eq("id", challenge_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Challenge not found")

    ch = result.data[0]

    if ch["challenger_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the challenger can withdraw")

    if ch["status"] != "pending":
        raise HTTPException(status_code=400, detail="Can only withdraw pending challenges")

    supabase.table("challenges").update(
        {"status": ChallengeStatus.CANCELLED.value}
    ).eq("id", challenge_id).execute()

    # Notify opponent
    user_profile = get_profile_by_id(supabase, user_id)
    supabase.table("notifications").insert({
        "user_id": ch["opponent_id"],
        "type": "challenge_withdrawn",
        "title": "Challenge withdrawn",
        "message": f"@{user_profile['username']} withdrew their challenge",
        "data": {"challenge_id": challenge_id},
    }).execute()

    return {"message": "Challenge withdrawn"}


def _generate_invite_code(length=8):
    """Generate a short, URL-friendly invite code."""
    chars = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


@router.post("/invite-link")
def create_challenge_link(
    challenge: ChallengeCreate,
    user_id: str = Depends(get_user_id),
):
    """Create a shareable challenge invite link. Anyone with the link can accept."""
    supabase = get_supabase()

    # Get creator profile
    creator = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not creator.data:
        raise HTTPException(status_code=400, detail="You must create a profile first")

    if challenge.deadline <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Deadline must be in the future")

    code = _generate_invite_code()

    result = supabase.table("challenge_links").insert({
        "creator_id": user_id,
        "skill": challenge.challenger_skill,
        "deadline": challenge.deadline.isoformat(),
        "message": challenge.message,
        "code": code,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create challenge link")

    return {
        "code": code,
        "link": f"/challenges/join/{code}",
        "expires_at": result.data[0].get("expires_at"),
    }


@router.get("/invite/{code}")
def get_challenge_link(code: str, user_id: str = Depends(get_user_id)):
    """Get details of a challenge invite link."""
    supabase = get_supabase()

    result = supabase.table("challenge_links").select(
        "*, creator:creator_id(id, username, display_name, avatar_url)"
    ).eq("code", code).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Challenge link not found")

    link = result.data[0]

    if link.get("used_by"):
        raise HTTPException(status_code=400, detail="This challenge link has already been used")

    if link.get("expires_at"):
        expires = datetime.fromisoformat(link["expires_at"].replace("Z", "+00:00"))
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="This challenge link has expired")

    return link


@router.post("/invite/{code}/accept")
def accept_challenge_link(
    code: str,
    user_id: str = Depends(get_user_id),
):
    """Accept a challenge invite link and create the challenge."""
    supabase = get_supabase()

    # Get the link
    link_result = supabase.table("challenge_links").select("*").eq("code", code).execute()

    if not link_result.data:
        raise HTTPException(status_code=404, detail="Challenge link not found")

    link = link_result.data[0]

    if link.get("used_by"):
        raise HTTPException(status_code=400, detail="This link has already been used")

    if str(link["creator_id"]) == str(user_id):
        raise HTTPException(status_code=400, detail="You cannot accept your own challenge link")

    # Create the challenge
    challenge_data = {
        "challenger_id": link["creator_id"],
        "opponent_id": user_id,
        "challenger_skill": link["skill"],
        "opponent_skill": link["skill"],
        "deadline": link["deadline"],
        "message": link.get("message"),
        "status": "pending",
    }

    challenge_result = supabase.table("challenges").insert(challenge_data).execute()

    if not challenge_result.data:
        raise HTTPException(status_code=500, detail="Failed to create challenge")

    challenge_id = challenge_result.data[0]["id"]

    # Mark the link as used
    supabase.table("challenge_links").update({
        "used_by": user_id,
        "challenge_id": challenge_id,
    }).eq("id", link["id"]).execute()

    # Notify the creator
    user_profile = supabase.table("profiles").select("username").eq("id", user_id).single().execute()
    username = user_profile.data["username"] if user_profile.data else "Someone"

    supabase.table("notifications").insert({
        "user_id": link["creator_id"],
        "type": "challenge_link_accepted",
        "title": "Challenge link accepted!",
        "message": f"@{username} accepted your challenge invite",
        "data": {"challenge_id": challenge_id},
    }).execute()

    return {
        "message": "Challenge created from invite link",
        "challenge_id": challenge_id,
    }

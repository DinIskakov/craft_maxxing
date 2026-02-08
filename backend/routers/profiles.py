from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from core.supabase_client import get_supabase
from schemas.challenges import (
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse,
    ProfileSearchResult,
)

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def get_user_id(authorization: str = Header(...)) -> str:
    """Extract user ID from the Authorization header (Bearer token)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    supabase = get_supabase()
    
    try:
        # Verify the token and get user
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@router.post("", response_model=ProfileResponse)
def create_profile(
    profile: ProfileCreate,
    user_id: str = Depends(get_user_id)
):
    """Create a profile for the authenticated user with a unique username."""
    supabase = get_supabase()
    
    # Check if username is taken
    existing = supabase.table("profiles").select("id").eq("username", profile.username.lower()).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Check if user already has a profile
    existing_profile = supabase.table("profiles").select("id").eq("id", user_id).execute()
    if existing_profile.data:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    # Create profile
    data = {
        "id": user_id,
        "username": profile.username.lower(),
        "display_name": profile.display_name or profile.username,
        "bio": profile.bio,
    }
    
    result = supabase.table("profiles").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create profile")
    
    return result.data[0]


@router.get("/me", response_model=Optional[ProfileResponse])
def get_my_profile(user_id: str = Depends(get_user_id)):
    """Get the current user's profile."""
    supabase = get_supabase()
    
    result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if not result.data:
        return None
    
    return result.data[0]


@router.patch("/me", response_model=ProfileResponse)
def update_my_profile(
    profile: ProfileUpdate,
    user_id: str = Depends(get_user_id)
):
    """Update the current user's profile."""
    supabase = get_supabase()
    
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return result.data[0]


@router.get("/search", response_model=List[ProfileSearchResult])
def search_profiles(
    q: str,
    limit: int = 10,
    user_id: str = Depends(get_user_id)
):
    """Search for users by username (for @tagging)."""
    if len(q) < 2:
        return []
    
    supabase = get_supabase()
    
    # 1. Search profiles
    result = supabase.table("profiles")\
        .select("id, username, display_name, avatar_url")\
        .ilike("username", f"{q.lower()}%")\
        .neq("id", user_id)\
        .limit(limit)\
        .execute()
        
    profiles = result.data or []
    if not profiles:
        return []
        
    # 2. Get friendship statuses for these profiles
    profile_ids = [p['id'] for p in profiles]
    
    # Check friendships where current user is involved
    friendships = supabase.table("friends").select("user_id, friend_id, status").or_(
        f"user_id.eq.{user_id},friend_id.eq.{user_id}"
    ).in_("friend_id" if profiles[0]['id'] != user_id else "user_id", profile_ids).execute()
    
    # Map status
    friend_map = {}
    for f in friendships.data:
        other_id = f['friend_id'] if f['user_id'] == user_id else f['user_id']
        friend_map[other_id] = f['status']
        
    # Add status to response
    for p in profiles:
        p['friendStatus'] = friend_map.get(p['id'], None)
        
    return profiles


@router.get("/{username}", response_model=ProfileResponse)
def get_profile_by_username(
    username: str,
    user_id: str = Depends(get_user_id)
):
    """Get a user's profile by username."""
    supabase = get_supabase()
    
    result = supabase.table("profiles")\
        .select("*")\
        .eq("username", username.lower())\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return result.data[0]


@router.get("/{username}/full")
def get_full_profile(
    username: str,
    user_id: str = Depends(get_user_id)
):
    """Get a user's full profile including friendship status, skills they're learning, and shared challenges."""
    supabase = get_supabase()

    # Get the target profile
    profile_result = supabase.table("profiles")\
        .select("*")\
        .eq("username", username.lower())\
        .execute()

    if not profile_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    target = profile_result.data[0]
    target_id = target["id"]
    is_self = str(target_id) == str(user_id)

    # Check friendship status
    friendship = None
    is_friend = False

    if not is_self:
        friendship_result = supabase.table("friends").select("*").or_(
            f"and(user_id.eq.{user_id},friend_id.eq.{target_id}),and(user_id.eq.{target_id},friend_id.eq.{user_id})"
        ).execute()

        if friendship_result.data:
            friendship = friendship_result.data[0]
            is_friend = friendship["status"] == "accepted"

    # Get skills they're currently learning (from active challenge progress) - only if friends or self
    current_skills = []
    if is_friend or is_self:
        skills_result = supabase.table("challenge_progress")\
            .select("skill_name, completed_days, total_days, completion_percentage, challenge_id")\
            .eq("user_id", target_id)\
            .execute()

        # Filter to only active challenges
        if skills_result.data:
            for s in skills_result.data:
                ch = supabase.table("challenges").select("status").eq("id", s["challenge_id"]).execute()
                if ch.data and ch.data[0]["status"] == "active":
                    current_skills.append({
                        "skill_name": s["skill_name"],
                        "completed_days": s["completed_days"],
                        "total_days": s["total_days"],
                        "completion_percentage": float(s["completion_percentage"] or 0),
                    })

    # Get shared challenges - only if friends or self
    shared_challenges = []
    if is_friend or is_self:
        shared_result = supabase.table("challenges")\
            .select("*")\
            .or_(
                f"and(challenger_id.eq.{user_id},opponent_id.eq.{target_id}),"
                f"and(challenger_id.eq.{target_id},opponent_id.eq.{user_id})"
            )\
            .order("created_at", desc=True)\
            .limit(20)\
            .execute()

        if shared_result.data:
            for ch in shared_result.data:
                # Add profile info
                challenger_profile = supabase.table("profiles")\
                    .select("id, username, display_name, avatar_url")\
                    .eq("id", ch["challenger_id"]).execute()
                opponent_profile = supabase.table("profiles")\
                    .select("id, username, display_name, avatar_url")\
                    .eq("id", ch["opponent_id"]).execute()

                ch["challenger"] = challenger_profile.data[0] if challenger_profile.data else None
                ch["opponent"] = opponent_profile.data[0] if opponent_profile.data else None
                shared_challenges.append(ch)

    return {
        "profile": target,
        "is_self": is_self,
        "is_friend": is_friend,
        "friendship": friendship,
        "current_skills": current_skills if (is_friend or is_self) else None,
        "shared_challenges": shared_challenges if (is_friend or is_self) else None,
    }


@router.get("/check/{username}")
def check_username_available(username: str):
    """Check if a username is available (no auth required)."""
    supabase = get_supabase()
    
    result = supabase.table("profiles")\
        .select("id")\
        .eq("username", username.lower())\
        .execute()
    
    return {"available": len(result.data) == 0}

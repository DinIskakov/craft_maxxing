from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from core.supabase_client import get_supabase

router = APIRouter(prefix="/api/friends", tags=["friends"])

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

class FriendRequest(BaseModel):
    friend_id: UUID

class FriendResponse(BaseModel):
    id: UUID
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    status: str
    friendship_id: UUID

class RequestAction(BaseModel):
    accept: bool

@router.get("", response_model=List[FriendResponse])
async def get_friends(user_id: str = Depends(get_user_id)):
    supabase = get_supabase()
    
    # Get all accepted friends
    # We need to check both user_id and friend_id columns because friendship is bidirectional
    response = supabase.table("friends").select(
        "id, status, user:user_id(id, username, display_name, avatar_url), friend:friend_id(id, username, display_name, avatar_url)"
    ).or_(f"user_id.eq.{user_id},friend_id.eq.{user_id}").eq("status", "accepted").execute()
    
    friends = []
    if response.data:
        for item in response.data:
            # Determine which side is the friend
            # item['user'] is object, item['friend'] is object
            # Supabase returns them as dictionaries
            
            # Since user_id is UUID string but response might have it as string too
            u_id = item['user']['id']
            
            is_user_initiator = str(u_id) == str(user_id)
            friend_data = item['friend'] if is_user_initiator else item['user']
            
            friends.append({
                "id": friend_data['id'],
                "username": friend_data['username'],
                "display_name": friend_data['display_name'],
                "avatar_url": friend_data['avatar_url'],
                "status": item['status'],
                "friendship_id": item['id']
            })
        
    return friends

@router.get("/requests", response_model=List[FriendResponse])
async def get_friend_requests(user_id: str = Depends(get_user_id)):
    supabase = get_supabase()
    
    # Get pending requests where current user is the friend_id (receiver)
    response = supabase.table("friends").select(
        "id, status, user:user_id(id, username, display_name, avatar_url)"
    ).eq("friend_id", user_id).eq("status", "pending").execute()
    
    requests = []
    if response.data:
        for item in response.data:
            requests.append({
                "id": item['user']['id'],
                "username": item['user']['username'],
                "display_name": item['user']['display_name'],
                "avatar_url": item['user']['avatar_url'],
                "status": item['status'],
                "friendship_id": item['id']
            })
        
    return requests

@router.post("", status_code=status.HTTP_201_CREATED)
async def add_friend(request: FriendRequest, user_id: str = Depends(get_user_id)):
    supabase = get_supabase()
    friend_id_str = str(request.friend_id)
    
    if user_id == friend_id_str:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
        
    # Check if request already exists
    existing = supabase.table("friends").select("*").or_(
        f"and(user_id.eq.{user_id},friend_id.eq.{friend_id_str}),and(user_id.eq.{friend_id_str},friend_id.eq.{user_id})"
    ).execute()
    
    if existing.data:
        status_val = existing.data[0]['status']
        if status_val == 'accepted':
            raise HTTPException(status_code=400, detail="Already friends")
        elif status_val == 'pending':
            raise HTTPException(status_code=400, detail="Friend request already pending")
        
    # Create request
    try:
        result = supabase.table("friends").insert({
            "user_id": user_id,
            "friend_id": friend_id_str,
            "status": "pending"
        }).execute()
        
        # Get user info for notification
        user_info = supabase.table("profiles").select("username").eq("id", user_id).single().execute()
        username = user_info.data['username'] if user_info.data else "Someone"
        
        # Create notification for friend
        supabase.table("notifications").insert({
            "user_id": friend_id_str,
            "type": "friend_request",
            "title": "New Friend Request",
            "message": f"@{username} sent you a friend request",
            "data": {"requester_id": user_id}
        }).execute()
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{request_id}/respond")
async def respond_to_request(request_id: UUID, action: RequestAction, user_id: str = Depends(get_user_id)):
    supabase = get_supabase()
    req_id_str = str(request_id)
    
    # Verify request exists and is for current user
    # Note: request_id here is the friendship ID from the friends table
    
    if action.accept:
        result = supabase.table("friends").update({
            "status": "accepted",
            "updated_at": datetime.now().isoformat()
        }).eq("id", req_id_str).eq("friend_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Request not found or not for you")
            
        # Notify sender
        friendship = result.data[0]
        
        # Get user info for notification
        user_info = supabase.table("profiles").select("username").eq("id", user_id).single().execute()
        username = user_info.data['username'] if user_info.data else "Someone"
        
        try:
            supabase.table("notifications").insert({
                "user_id": friendship['user_id'],
                "type": "friend_accepted",
                "title": "Friend Request Accepted",
                "message": f"@{username} accepted your friend request",
                "data": {"friend_id": user_id}
            }).execute()
        except:
            pass # Notification failure shouldn't fail the request
        
        return {"message": "Friend request accepted"}
    else:
        # Delete the request if declined
        result = supabase.table("friends").delete().eq("id", req_id_str).eq("friend_id", user_id).execute()
        
        if not result.data:
            # It might have been already deleted or not found
            # check if it exists at all
            existing = supabase.table("friends").select("id").eq("id", req_id_str).execute()
            if not existing.data:
                raise HTTPException(status_code=404, detail="Request not found")
            else:
                raise HTTPException(status_code=403, detail="Not authorized to decline this request")
            
        return {"message": "Friend request declined"}

@router.get("/activity")
async def get_friends_activity(user_id: str = Depends(get_user_id)):
    """Get active challenge skills from friends for the discover feed."""
    supabase = get_supabase()

    # Get all accepted friends
    friends_response = supabase.table("friends").select(
        "user:user_id(id, username, display_name, avatar_url), friend:friend_id(id, username, display_name, avatar_url)"
    ).or_(f"user_id.eq.{user_id},friend_id.eq.{user_id}").eq("status", "accepted").execute()

    if not friends_response.data:
        return []

    # Collect friend IDs
    friend_ids = []
    friend_map = {}
    for item in friends_response.data:
        u_id = item['user']['id']
        is_user_initiator = str(u_id) == str(user_id)
        friend_data = item['friend'] if is_user_initiator else item['user']
        fid = str(friend_data['id'])
        friend_ids.append(fid)
        friend_map[fid] = friend_data

    if not friend_ids:
        return []

    # Get active challenge progress for all friends
    activity = []
    for fid in friend_ids:
        progress_result = supabase.table("challenge_progress")\
            .select("skill_name, completed_days, total_days, challenge_id")\
            .eq("user_id", fid)\
            .execute()

        if not progress_result.data:
            continue

        for p in progress_result.data:
            # Verify the challenge is active
            ch = supabase.table("challenges").select("status").eq("id", p["challenge_id"]).execute()
            if ch.data and ch.data[0]["status"] == "active":
                friend_data = friend_map.get(fid, {})
                activity.append({
                    "username": friend_data.get("username", "unknown"),
                    "display_name": friend_data.get("display_name"),
                    "avatar_url": friend_data.get("avatar_url"),
                    "skill_name": p["skill_name"],
                    "completed_days": p["completed_days"],
                    "total_days": p["total_days"],
                })

    return activity


@router.delete("/{friendship_id}")
async def remove_friend(friendship_id: UUID, user_id: str = Depends(get_user_id)):
    supabase = get_supabase()
    
    # Verify friendship involves current user
    result = supabase.table("friends").delete().eq("id", str(friendship_id)).or_(
        f"user_id.eq.{user_id},friend_id.eq.{user_id}"
    ).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Friendship not found")
        
    return {"message": "Friend removed"}

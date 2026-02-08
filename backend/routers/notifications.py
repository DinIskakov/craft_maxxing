from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from core.supabase_client import get_supabase

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


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


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: Optional[str] = None
    data: Optional[dict] = None
    read: bool = False
    created_at: datetime


class NotificationCount(BaseModel):
    unread: int


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    limit: int = 20,
    user_id: str = Depends(get_user_id),
):
    """Get notifications for the current user, newest first."""
    supabase = get_supabase()

    result = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    return result.data or []


@router.get("/unread-count", response_model=NotificationCount)
async def get_unread_count(user_id: str = Depends(get_user_id)):
    """Get the count of unread notifications."""
    supabase = get_supabase()

    result = (
        supabase.table("notifications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("read", False)
        .execute()
    )

    return {"unread": result.count or 0}


@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, user_id: str = Depends(get_user_id)):
    """Mark a single notification as read."""
    supabase = get_supabase()

    result = (
        supabase.table("notifications")
        .update({"read": True})
        .eq("id", notification_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification marked as read"}


@router.post("/read-all")
async def mark_all_as_read(user_id: str = Depends(get_user_id)):
    """Mark all notifications as read."""
    supabase = get_supabase()

    supabase.table("notifications").update({"read": True}).eq(
        "user_id", user_id
    ).eq("read", False).execute()

    return {"message": "All notifications marked as read"}

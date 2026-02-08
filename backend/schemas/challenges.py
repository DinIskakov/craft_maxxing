from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ChallengeStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


# ============================================
# Profile Schemas
# ============================================

class ProfileCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    display_name: Optional[str] = None
    bio: Optional[str] = None


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileResponse(BaseModel):
    id: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    total_wins: int = 0
    total_losses: int = 0
    created_at: datetime


class ProfileSearchResult(BaseModel):
    id: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    friendStatus: Optional[str] = None  # 'accepted', 'pending', or None


# ============================================
# Challenge Schemas
# ============================================

class ChallengeCreate(BaseModel):
    opponent_username: str
    challenger_skill: str
    opponent_skill: str
    deadline: datetime
    message: Optional[str] = None
    response_days: Optional[int] = 3  # How many days the opponent has to respond (1, 3, 7)


class ChallengeResponse(BaseModel):
    id: str
    challenger_id: str
    opponent_id: str
    challenger_skill: str
    opponent_skill: str
    deadline: datetime
    status: ChallengeStatus
    winner_id: Optional[str] = None
    message: Optional[str] = None
    response_deadline: Optional[datetime] = None
    created_at: datetime
    # Populated fields
    challenger: Optional[ProfileSearchResult] = None
    opponent: Optional[ProfileSearchResult] = None


class ChallengeAccept(BaseModel):
    accept: bool  # True to accept, False to decline


class ChallengeProgressUpdate(BaseModel):
    completed: bool
    notes: Optional[str] = None


class ChallengeProgressResponse(BaseModel):
    id: str
    challenge_id: str
    user_id: str
    skill_name: str
    completed_days: int
    total_days: int
    completion_percentage: float
    last_checkin: Optional[datetime] = None


class ChallengeWithProgress(BaseModel):
    challenge: ChallengeResponse
    my_progress: Optional[ChallengeProgressResponse] = None
    opponent_progress: Optional[ChallengeProgressResponse] = None

from typing import List

from pydantic import BaseModel, Field


class LearningPlanRequest(BaseModel):
    skill_name: str = Field(..., min_length=1)


class Task(BaseModel):
    title: str
    instruction: str


class DayPlan(BaseModel):
    day: int = Field(..., ge=1, le=30)
    tasks: List[Task] = Field(..., min_length=2, max_length=3)


class WeeklyMilestone(BaseModel):
    week: int = Field(..., ge=1, le=4)
    goal: str


class LearningPlanResponse(BaseModel):
    weeklyMilestones: List[WeeklyMilestone] = Field(..., min_length=4, max_length=4)
    days: List[DayPlan] = Field(..., min_length=30, max_length=30)

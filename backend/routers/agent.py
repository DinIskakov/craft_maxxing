from fastapi import APIRouter

from core.agent import generate_learning_plan
from schemas.learning_plan import (
    LearningPlanRequest,
    LearningPlanResponse,
)

router = APIRouter(prefix="/api", tags=["learning-plan"])


@router.post("/learning-plan", response_model=LearningPlanResponse)
def create_learning_plan(payload: LearningPlanRequest) -> LearningPlanResponse:
    return generate_learning_plan(payload.skill_name)

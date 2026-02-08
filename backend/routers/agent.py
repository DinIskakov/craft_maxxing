from fastapi import APIRouter, Depends, Header, HTTPException
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from core.agent import generate_learning_plan
from schemas.learning_plan import (
    LearningPlanRequest,
    LearningPlanResponse,
)

router = APIRouter(prefix="/api", tags=["learning-plan"])


def get_user_id(authorization: str = Header(...)) -> str:
    """Extract user ID from the Authorization header (Bearer token)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    from core.supabase_client import get_supabase

    token = authorization.replace("Bearer ", "")
    supabase = get_supabase()
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user.id
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Authentication failed: {str(e)}"
        )


@router.post("/learning-plan", response_model=LearningPlanResponse)
def create_learning_plan(payload: LearningPlanRequest) -> LearningPlanResponse:
    return generate_learning_plan(payload.skill_name)


@router.post("/suggest-skill")
def suggest_skill(user_id: str = Depends(get_user_id)):
    """Use AI to suggest a random interesting skill to learn in 30 days."""
    try:
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=1.0)

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a creative skill discovery assistant. "
                    "Suggest ONE unique, interesting, learnable-in-30-days skill. "
                    "Be creative and varied - suggest anything from artistic skills, "
                    "physical skills, intellectual pursuits, crafts, tech skills, music, etc. "
                    "Respond with ONLY valid JSON in this exact format: "
                    '{"skill_name": "Short Skill Name", "description": "One sentence about why this is fun and achievable in 30 days."} '
                    "Do NOT include any other text or markdown.",
                ),
                ("human", "Suggest a random skill for me to learn."),
            ]
        )

        response = llm.invoke(prompt.invoke({}))
        content = response.content.strip()

        # Parse the JSON response
        import json

        # Handle potential markdown code blocks
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        result = json.loads(content)
        return {
            "skill_name": result.get("skill_name", "Drawing"),
            "description": result.get(
                "description", "A creative and relaxing skill you can learn in 30 days."
            ),
        }
    except Exception as e:
        # Fallback if AI fails
        return {
            "skill_name": "Origami",
            "description": "The art of paper folding - start with simple shapes and progress to complex designs in 30 days.",
        }

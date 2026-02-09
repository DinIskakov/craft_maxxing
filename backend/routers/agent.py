import json
import random

from fastapi import APIRouter, Depends, Header, HTTPException
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from opik import track

from core.agent import generate_learning_plan
from core.supabase_client import get_supabase
from schemas.learning_plan import (
    LearningPlanRequest,
    LearningPlanResponse,
)

router = APIRouter(prefix="/api", tags=["learning-plan"])


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
        raise HTTPException(
            status_code=401, detail=f"Authentication failed: {str(e)}"
        )


@router.post("/learning-plan", response_model=LearningPlanResponse)
def create_learning_plan(payload: LearningPlanRequest) -> LearningPlanResponse:
    return generate_learning_plan(payload.skill_name)


@track(name="suggest_skill_llm_call")
def _call_ai_for_skill(avoid_clause: str, seed: int) -> dict:
    """Tracked LLM call for skill suggestion."""
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=1.3,
        max_retries=3,
        request_timeout=30,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a wildly creative skill discovery assistant for an app "
                "where people learn new skills in 30 days. Your job is to suggest "
                "ONE skill that is:\n"
                "- Unique and surprising (avoid common/obvious suggestions)\n"
                "- Specific (not vague like 'cooking' - instead 'Thai curry from scratch')\n"
                "- Achievable in 30 days of daily practice\n"
                "- From ANY domain imaginable - arts, sports, tech, crafts, music, "
                "science, languages, games, survival, performance, anything\n"
                "- DIFFERENT every single time you are asked\n\n"
                "Never repeat yourself. Always surprise the user with something "
                "they would never have thought of."
                f"{avoid_clause}\n\n"
                "Respond with ONLY valid JSON:\n"
                '{{ "skill_name": "Short Skill Name", "description": "One sentence why this is fun and doable in 30 days." }}\n'
                "No markdown, no code blocks, no extra text.",
            ),
            (
                "human",
                f"Surprise me with a skill to learn! (variation: {seed})",
            ),
        ]
    )

    response = llm.invoke(prompt.invoke({}))
    content = response.content.strip()

    # Handle potential markdown code blocks just in case
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    result = json.loads(content)

    skill_name = result.get("skill_name", "").strip()
    description = result.get("description", "").strip()

    if not skill_name or not description:
        raise ValueError("AI returned empty skill name or description")

    return {"skill_name": skill_name, "description": description}


@router.post("/suggest-skill")
def suggest_skill(user_id: str = Depends(get_user_id)):
    """Use AI to suggest a random interesting skill to learn in 30 days."""
    # Get user's existing skills to avoid suggesting duplicates
    supabase = get_supabase()
    existing_skills = []
    try:
        progress = supabase.table("challenge_progress")\
            .select("skill_name")\
            .eq("user_id", user_id)\
            .execute()
        if progress.data:
            existing_skills = [p["skill_name"] for p in progress.data]
    except Exception:
        pass

    avoid_clause = ""
    if existing_skills:
        avoid_clause = (
            f"\n\nIMPORTANT: The user is already learning these skills, "
            f"so do NOT suggest any of them: {', '.join(existing_skills)}."
        )

    seed = random.randint(1, 100000)

    try:
        return _call_ai_for_skill(avoid_clause, seed)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate skill suggestion: {str(e)}"
        )

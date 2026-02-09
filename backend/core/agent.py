from typing import TypedDict, Dict, Any

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from opik import track

from core.prompts import LEARNING_PLAN_SYSTEM_PROMPT
from schemas.learning_plan import LearningPlanResponse

load_dotenv()


class PlanState(TypedDict):
    skill_name: str
    plan_json: Dict[str, Any]


@track(name="generate_plan_llm_call")
def _generate_plan(state: PlanState) -> PlanState:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    parser = PydanticOutputParser(pydantic_object=LearningPlanResponse)

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", LEARNING_PLAN_SYSTEM_PROMPT),
            ("human", "Create the learning plan for this skill: {skill_name}"),
        ]
    ).partial(format_instructions=parser.get_format_instructions())

    response = llm.invoke(prompt.invoke({"skill_name": state["skill_name"]}))

    plan_json = parser.parse(response.content).model_dump()
    return {"skill_name": state["skill_name"], "plan_json": plan_json}


_graph = StateGraph(PlanState)
_graph.add_node("generate_plan", _generate_plan)
_graph.set_entry_point("generate_plan")
_graph.add_edge("generate_plan", END)
_compiled_graph = _graph.compile()


@track(name="generate_learning_plan")
def generate_learning_plan(skill_name: str) -> Dict[str, Any]:
    result = _compiled_graph.invoke({"skill_name": skill_name})
    return result["plan_json"]

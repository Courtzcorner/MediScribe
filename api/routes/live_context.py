"""
Live context generation: questions, DDx, and notes during a visit.
"""
from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.analysis.claude_client import ClaudeClient
from backend.storage.db_handler import DBHandler
from backend.utils.error_handler import NotFoundError
from api.middleware.auth import get_current_user

router = APIRouter()


class LiveContextRequest(BaseModel):
    session_id: str
    transcript_id: str | None = None
    transcript_text: str | None = None   # raw text for live in-session generation


class LiveContextResponse(BaseModel):
    questions: list[str]
    ddx: list[str]
    notes: str


def get_db() -> DBHandler:
    return DBHandler()


def get_claude() -> ClaudeClient:
    return ClaudeClient()


@router.post("/generate", response_model=LiveContextResponse)
async def generate_live_context(
    payload: LiveContextRequest,
    db: DBHandler = Depends(get_db),
    claude: ClaudeClient = Depends(get_claude),
    current_user: dict = Depends(get_current_user),
):
    """
    Generate live context (questions, DDx, notes) from transcript for use during a visit.
    """
    session = db.get_session(payload.session_id)
    if session.doctor_id != current_user["sub"]:
        raise NotFoundError("Session not found")

    if payload.transcript_text:
        conversation_text = payload.transcript_text
    elif payload.transcript_id:
        transcript = db.get_transcript(payload.transcript_id)
        if transcript.session_id != payload.session_id:
            raise NotFoundError("Transcript does not belong to this session")
        conversation_text = "\n".join(
            f"[{s.speaker.value.upper()}]: {s.text}" for s in transcript.segments
        )
    else:
        from backend.utils.error_handler import AnalysisError
        raise AnalysisError("Either transcript_id or transcript_text must be provided")

    prompt_path = Path(__file__).resolve().parent.parent.parent / "backend/analysis/prompts/live_context.txt"
    system_prompt = prompt_path.read_text() if prompt_path.exists() else (
        "Produce JSON with keys: questions (list of suggested questions), ddx (list of differential diagnoses), notes (brief clinical summary). Return only valid JSON."
    )
    user_message = (
        "TRANSCRIPT SO FAR:\n\n"
        + conversation_text
        + "\n\nProduce the JSON response."
    )
    raw = claude.invoke(system_prompt, user_message, max_tokens=2048, temperature=0.2)

    # Extract JSON from response (handle markdown code blocks)
    text = raw.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        from backend.utils.error_handler import AnalysisError
        raise AnalysisError(f"Failed to parse live context response: {e}") from e

    questions = data.get("questions") or []
    ddx = data.get("ddx") or []
    notes = data.get("notes") or ""

    if not isinstance(questions, list):
        questions = [str(q) for q in questions] if questions else []
    else:
        questions = [str(q) for q in questions]
    if not isinstance(ddx, list):
        ddx = [str(d) for d in ddx] if ddx else []
    else:
        ddx = [str(d) for d in ddx]

    return LiveContextResponse(questions=questions, ddx=ddx, notes=notes)

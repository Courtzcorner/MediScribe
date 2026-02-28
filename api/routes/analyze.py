from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.models.analysis_result import AnalysisResult
from backend.models.transcript import Transcript
from backend.pipeline.orchestrator import MedicalPipelineOrchestrator
from backend.storage.db_handler import DBHandler
from backend.utils.error_handler import NotFoundError
from api.middleware.auth import get_current_user

router = APIRouter()


class AnalyzeRequest(BaseModel):
    session_id: str
    transcript_id: str


def get_db() -> DBHandler:
    return DBHandler()


def get_orchestrator() -> MedicalPipelineOrchestrator:
    return MedicalPipelineOrchestrator()


@router.post("/stream")
async def stream_analysis(
    payload: AnalyzeRequest,
    db: DBHandler = Depends(get_db),
    orchestrator: MedicalPipelineOrchestrator = Depends(get_orchestrator),
    current_user: dict = Depends(get_current_user),
):
    """
    Stream Claude's analysis as Server-Sent Events.
    Frontend receives text chunks then a final 'complete' event with full JSON.
    """
    session = db.get_session(payload.session_id)
    if session.doctor_id != current_user["sub"]:
        raise NotFoundError("Session not found")

    # Build a minimal transcript object for the orchestrator
    # In production this would be fetched from DB by transcript_id
    transcript = Transcript(
        id=payload.transcript_id,
        session_id=payload.session_id,
        raw_text="",  # orchestrator will use segments
        segments=[],
    )

    async def event_generator():
        try:
            full_text = ""
            # Run sync generator in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            gen = orchestrator.stream_analysis(session, transcript)

            for chunk in gen:
                full_text += chunk
                data = json.dumps({"type": "chunk", "content": chunk})
                yield f"data: {data}\n\n"
                await asyncio.sleep(0)  # yield control

        except Exception as e:
            error_data = json.dumps({"type": "error", "error": str(e)})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{session_id}", response_model=AnalysisResult)
async def get_analysis(
    session_id: str,
    db: DBHandler = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve the latest analysis for a completed session."""
    session = db.get_session(session_id)
    if session.doctor_id != current_user["sub"]:
        raise NotFoundError("Session not found")
    if not session.analysis_id:
        raise NotFoundError("Analysis not yet available for this session")
    return db.get_analysis_by_session(session_id)

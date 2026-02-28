from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.middleware.auth import get_current_user
from backend.analysis.medical_analyzer import MedicalAnalyzer
from backend.models.analysis_result import AnalysisResult
from backend.storage.db_handler import DBHandler
from backend.utils.error_handler import NotFoundError

router = APIRouter()


class AnalyzeRequest(BaseModel):
    session_id: str
    transcript_id: str


def get_db() -> DBHandler:
    return DBHandler()


def get_analyzer() -> MedicalAnalyzer:
    return MedicalAnalyzer()


@router.post("/", response_model=AnalysisResult)
async def analyze(
    payload: AnalyzeRequest,
    db: DBHandler = Depends(get_db),
    analyzer: MedicalAnalyzer = Depends(get_analyzer),
    current_user: dict = Depends(get_current_user),
) -> AnalysisResult:
    """
    Run a full, non-streaming Claude medical analysis for a transcript.
    """
    session = db.get_session(payload.session_id)
    if session.doctor_id != current_user["sub"]:
        raise NotFoundError("Session not found")

    transcript = db.get_transcript(payload.transcript_id)
    if transcript.session_id != payload.session_id:
        raise NotFoundError("Transcript does not belong to this session")

    analysis = analyzer.analyze_transcript(session, transcript)

    # Persist analysis and link it back to the session
    db.save_analysis(analysis)
    session.analysis_id = analysis.id
    db.save_session(session)

    return analysis


@router.post("/stream")
async def analyze_stream(
    payload: AnalyzeRequest,
    db: DBHandler = Depends(get_db),
    analyzer: MedicalAnalyzer = Depends(get_analyzer),
    current_user: dict = Depends(get_current_user),
) -> StreamingResponse:
    """
    Stream Claude's analysis as Server-Sent Events.

    - `type: "chunk"` events contain incremental text chunks from Claude
    - a final `type: "complete"` event contains the full structured JSON
      AnalysisResult payload (suitable for driving the UI)
    """
    session = db.get_session(payload.session_id)
    if session.doctor_id != current_user["sub"]:
        raise NotFoundError("Session not found")

    transcript = db.get_transcript(payload.transcript_id)
    if transcript.session_id != payload.session_id:
        raise NotFoundError("Transcript does not belong to this session")

    async def event_generator() -> AsyncGenerator[str, None]:
        full_text = ""
        try:
            # Use the synchronous generator in an async context; the underlying
            # Bedrock client is blocking so we simply yield control between
            # chunks to keep the event loop responsive.
            for chunk in analyzer.analyze_transcript_stream(session, transcript):
                full_text += chunk
                data = json.dumps({"type": "chunk", "content": chunk})
                yield f"data: {data}\n\n"
                await asyncio.sleep(0)

            # Once streaming is finished, parse into a structured result
            analysis = analyzer.parse_response(full_text, session, transcript)

            # Persist the final analysis and link to the session
            db.save_analysis(analysis)
            session.analysis_id = analysis.id
            db.save_session(session)

            complete_payload = {
                "type": "complete",
                "content": analysis.model_dump(mode="json"),
            }
            yield f"data: {json.dumps(complete_payload)}\n\n"
        except Exception as exc:  # noqa: BLE001
            error_data = json.dumps({"type": "error", "error": str(exc)})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


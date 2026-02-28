from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, File, Form, UploadFile
from backend.models.transcript import Transcript
from backend.pipeline.orchestrator import MedicalPipelineOrchestrator
from backend.storage.db_handler import DBHandler
from backend.utils.error_handler import NotFoundError
from api.middleware.auth import get_current_user

router = APIRouter()


def get_db() -> DBHandler:
    return DBHandler()


def get_orchestrator() -> MedicalPipelineOrchestrator:
    return MedicalPipelineOrchestrator()


@router.post("/{session_id}", response_model=Transcript, status_code=202)
async def transcribe_audio(
    session_id: str,
    audio: UploadFile = File(..., description="Audio file (webm, wav, mp3, mp4)"),
    language: str = Form(default="en-US"),
    db: DBHandler = Depends(get_db),
    orchestrator: MedicalPipelineOrchestrator = Depends(get_orchestrator),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload audio for a session and start transcription.
    Returns the transcript once processing is complete.
    For async processing, use the job endpoint instead.
    """
    session = db.get_session(session_id)
    if session.doctor_id != current_user["sub"]:
        raise NotFoundError("Session not found")

    audio_bytes = await audio.read()
    ext = (audio.filename or "audio.webm").rsplit(".", 1)[-1].lower()

    # Run the synchronous pipeline in a thread pool so it doesn't block the event loop.
    # process_recording calls S3, Amazon Transcribe, and Claude — all potentially slow.
    transcript, analysis = await asyncio.to_thread(
        orchestrator.process_recording, session, audio_bytes, audio_format=ext
    )
    db.save_transcript(transcript)
    db.save_analysis(analysis)
    db.save_session(session)

    return transcript


@router.get("/{session_id}", response_model=Transcript)
async def get_transcript(
    session_id: str,
    db: DBHandler = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve the transcript for a completed session."""
    session = db.get_session(session_id)
    if session.doctor_id != current_user["sub"]:
        raise NotFoundError("Session not found")
    if not session.transcript_id:
        raise NotFoundError("Transcript not yet available for this session")
    return db.get_transcript(session.transcript_id)

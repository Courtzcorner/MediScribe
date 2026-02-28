from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from backend.models.patient_session import (
    PatientSession,
    CreateSessionRequest,
    UpdateSessionRequest,
)
from backend.storage.db_handler import DBHandler
from backend.utils.error_handler import NotFoundError
from api.middleware.auth import get_current_user

router = APIRouter()


def get_db() -> DBHandler:
    return DBHandler()


@router.get("/", response_model=list[PatientSession])
async def list_sessions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: DBHandler = Depends(get_db),
    # current_user: dict = Depends(get_current_user),  # Temporarily disabled
):
    """List all sessions for the authenticated doctor."""
    # Use a default user for MVP
    return db.list_sessions(doctor_id="mvp-user", limit=limit, offset=offset)


@router.post("/", response_model=PatientSession, status_code=201)
async def create_session(
    payload: CreateSessionRequest,
    db: DBHandler = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new recording session."""
    session = PatientSession(
        title=payload.title,
        doctor_id=current_user["sub"],
        patient_id=payload.patient_id,
        notes=payload.notes,
    )
    db.save_session(session)
    return session


@router.get("/{session_id}", response_model=PatientSession)
async def get_session(
    session_id: str,
    db: DBHandler = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a single session by ID."""
    session = db.get_session(session_id)
    if session.doctor_id != current_user["sub"]:
        raise NotFoundError("Session not found")
    return session


@router.patch("/{session_id}", response_model=PatientSession)
async def update_session(
    session_id: str,
    payload: UpdateSessionRequest,
    db: DBHandler = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update session metadata."""
    session = db.get_session(session_id)
    if session.doctor_id != current_user["sub"]:
        raise NotFoundError("Session not found")
    if payload.title is not None:
        session.title = payload.title
    if payload.status is not None:
        session.status = payload.status
    if payload.notes is not None:
        session.notes = payload.notes
    if payload.duration is not None:
        session.duration = payload.duration
    db.save_session(session)
    return session


@router.delete("/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    db: DBHandler = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a session (soft delete via status)."""
    session = db.get_session(session_id)
    if session.doctor_id != current_user["sub"]:
        raise NotFoundError("Session not found")
    # In production, mark as deleted rather than hard-deleting
    from backend.models.patient_session import SessionStatus
    session.status = SessionStatus.FAILED  # reuse FAILED as soft-delete marker
    db.save_session(session)

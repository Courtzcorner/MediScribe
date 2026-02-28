"""
Simple sessions API - no auth, just basic CRUD.
"""
from fastapi import APIRouter
from backend.models.patient_session import PatientSession, CreateSessionRequest
from backend.storage.db_handler_simple import SimpleDBHandler

router = APIRouter()


@router.get("/")
async def list_sessions():
    """List all sessions."""
    db = SimpleDBHandler()
    sessions = db.list_sessions()
    return sessions


@router.post("/", status_code=201)
async def create_session(payload: CreateSessionRequest):
    """Create a new session."""
    db = SimpleDBHandler()
    session = PatientSession(
        title=payload.title,
        doctor_id="test-doctor",
        patient_id=payload.patient_id,
        notes=payload.notes,
    )
    db.save_session(session)
    return session


@router.get("/{session_id}")
async def get_session(session_id: str):
    """Get a session by ID."""
    db = SimpleDBHandler()
    session = db.get_session(session_id)
    if not session:
        return {"error": "Session not found"}, 404
    return session

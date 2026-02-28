from __future__ import annotations
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
import uuid


class SessionStatus(str, Enum):
    IDLE = "idle"
    RECORDING = "recording"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PatientSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    doctor_id: str
    patient_id: str | None = None
    status: SessionStatus = SessionStatus.IDLE
    duration: int = 0           # seconds
    audio_url: str | None = None
    transcript_id: str | None = None
    analysis_id: str | None = None
    notes: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def mark_processing(self) -> None:
        self.status = SessionStatus.PROCESSING
        self.updated_at = datetime.utcnow()

    def mark_completed(self, transcript_id: str, analysis_id: str) -> None:
        self.status = SessionStatus.COMPLETED
        self.transcript_id = transcript_id
        self.analysis_id = analysis_id
        self.updated_at = datetime.utcnow()

    def mark_failed(self) -> None:
        self.status = SessionStatus.FAILED
        self.updated_at = datetime.utcnow()


class CreateSessionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    title: str
    patient_id: str | None = Field(None, alias="patientId")
    notes: str | None = None


class UpdateSessionRequest(BaseModel):
    title: str | None = None
    status: SessionStatus | None = None
    notes: str | None = None
    duration: int | None = None

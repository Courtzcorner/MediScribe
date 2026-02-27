from __future__ import annotations
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
import uuid


class SpeakerRole(str, Enum):
    DOCTOR = "doctor"
    PATIENT = "patient"
    UNKNOWN = "unknown"


class TranscriptSegment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    speaker: SpeakerRole = SpeakerRole.UNKNOWN
    text: str
    start_time: float  # seconds from recording start
    end_time: float
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)


class Transcript(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    segments: list[TranscriptSegment] = Field(default_factory=list)
    raw_text: str = ""
    language: str = "en-US"
    word_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @classmethod
    def from_segments(cls, session_id: str, segments: list[TranscriptSegment]) -> "Transcript":
        raw_text = " ".join(s.text for s in segments)
        return cls(
            session_id=session_id,
            segments=segments,
            raw_text=raw_text,
            word_count=len(raw_text.split()),
        )


class UpdateSegmentRequest(BaseModel):
    text: str
    speaker: SpeakerRole | None = None


class TranscriptUpdateRequest(BaseModel):
    segments: list[UpdateSegmentRequest]

from __future__ import annotations
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
import uuid


class Severity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


class DiagnosisStatus(str, Enum):
    NEW = "new"
    EXISTING = "existing"
    RESOLVED = "resolved"


class SOAPNote(BaseModel):
    subjective: str = ""    # Patient's symptoms, history, chief complaint
    objective: str = ""     # Vitals, exam findings, lab/imaging results
    assessment: str = ""    # Clinical impression / differential diagnosis
    plan: str = ""          # Treatment plan, orders, referrals


class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str | None = None
    route: str | None = None        # oral, IV, topical, inhaled...
    instructions: str | None = None


class Diagnosis(BaseModel):
    condition: str
    icd_code: str | None = None
    severity: Severity | None = None
    status: DiagnosisStatus = DiagnosisStatus.NEW
    notes: str | None = None


class FollowUp(BaseModel):
    timeframe: str
    instructions: str
    referrals: list[str] = Field(default_factory=list)
    lab_orders: list[str] = Field(default_factory=list)
    imaging_orders: list[str] = Field(default_factory=list)


class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    transcript_id: str
    summary: str = ""
    soap_note: SOAPNote = Field(default_factory=SOAPNote)
    medications: list[Medication] = Field(default_factory=list)
    diagnoses: list[Diagnosis] = Field(default_factory=list)
    follow_up: FollowUp | None = None
    key_points: list[str] = Field(default_factory=list)
    patient_instructions: str | None = None
    model_used: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

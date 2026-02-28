from __future__ import annotations

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
import uuid


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mrn: str = Field(default_factory=lambda: f"MRN-{str(uuid.uuid4())[:8].upper()}")
    first_name: str
    last_name: str
    dob: str | None = None          # ISO date string e.g. "1985-03-21"
    gender: Gender | None = None
    phone: str | None = None
    email: str | None = None
    allergies: list[str] = Field(default_factory=list)
    current_medications: list[str] = Field(default_factory=list)
    conditions: list[str] = Field(default_factory=list)
    doctor_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CreatePatientRequest(BaseModel):
    first_name: str
    last_name: str
    dob: str | None = None
    gender: Gender | None = None
    phone: str | None = None
    email: str | None = None
    allergies: list[str] = Field(default_factory=list)
    current_medications: list[str] = Field(default_factory=list)
    conditions: list[str] = Field(default_factory=list)


class UpdatePatientRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    dob: str | None = None
    gender: Gender | None = None
    phone: str | None = None
    email: str | None = None
    allergies: list[str] | None = None
    current_medications: list[str] | None = None
    conditions: list[str] | None = None

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from backend.models.patient import Patient, CreatePatientRequest, UpdatePatientRequest
from backend.storage.db_handler import DBHandler
from backend.utils.error_handler import NotFoundError
from api.middleware.auth import get_current_user

router = APIRouter()


def get_db() -> DBHandler:
    return DBHandler()


@router.get("/", response_model=list[Patient])
async def list_patients(
    search: str | None = Query(None, description="Search by name, MRN, or phone"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: DBHandler = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List or search patients for the authenticated doctor."""
    if search and search.strip():
        return db.search_patients(doctor_id=current_user["sub"], query=search.strip(), limit=limit)
    return db.list_patients(doctor_id=current_user["sub"], limit=limit, offset=offset)


@router.post("/", response_model=Patient, status_code=201)
async def create_patient(
    payload: CreatePatientRequest,
    db: DBHandler = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Register a new patient."""
    patient = Patient(
        first_name=payload.first_name,
        last_name=payload.last_name,
        dob=payload.dob,
        gender=payload.gender,
        phone=payload.phone,
        email=payload.email,
        allergies=payload.allergies,
        current_medications=payload.current_medications,
        conditions=payload.conditions,
        doctor_id=current_user["sub"],
    )
    db.save_patient(patient)
    return patient


@router.get("/{patient_id}", response_model=Patient)
async def get_patient(
    patient_id: str,
    db: DBHandler = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a single patient by ID."""
    patient = db.get_patient(patient_id)
    if patient.doctor_id != current_user["sub"]:
        raise NotFoundError("Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=Patient)
async def update_patient(
    patient_id: str,
    payload: UpdatePatientRequest,
    db: DBHandler = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update patient details."""
    patient = db.get_patient(patient_id)
    if patient.doctor_id != current_user["sub"]:
        raise NotFoundError("Patient not found")
    if payload.first_name is not None:
        patient.first_name = payload.first_name
    if payload.last_name is not None:
        patient.last_name = payload.last_name
    if payload.dob is not None:
        patient.dob = payload.dob
    if payload.gender is not None:
        patient.gender = payload.gender
    if payload.phone is not None:
        patient.phone = payload.phone
    if payload.email is not None:
        patient.email = payload.email
    if payload.allergies is not None:
        patient.allergies = payload.allergies
    if payload.current_medications is not None:
        patient.current_medications = payload.current_medications
    if payload.conditions is not None:
        patient.conditions = payload.conditions
    db.save_patient(patient)
    return patient

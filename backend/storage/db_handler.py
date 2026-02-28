"""
Database handler using SQLAlchemy for persisting sessions,
transcripts, and analysis results.
"""
from __future__ import annotations

from datetime import datetime
from functools import lru_cache
from typing import Any

from sqlalchemy import (
    Column, String, Integer, Text, DateTime, Enum as SAEnum,
    JSON, create_engine, select, update
)
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from backend.models.patient_session import PatientSession, SessionStatus
from backend.models.transcript import Transcript, TranscriptSegment
from backend.models.analysis_result import AnalysisResult
from backend.models.patient import Patient
from backend.utils.logger import get_logger
from backend.utils.error_handler import StorageError, NotFoundError
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class Base(DeclarativeBase):
    pass


class SessionRecord(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    doctor_id = Column(String, nullable=False)
    patient_id = Column(String, nullable=True)
    status = Column(SAEnum(SessionStatus), default=SessionStatus.IDLE)
    duration = Column(Integer, default=0)
    audio_url = Column(Text, nullable=True)
    transcript_id = Column(String, nullable=True)
    analysis_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TranscriptRecord(Base):
    __tablename__ = "transcripts"
    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False, index=True)
    raw_text = Column(Text, nullable=False, default="")
    segments = Column(JSON, nullable=False, default=list)
    language = Column(String, default="en-US")
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PatientRecord(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True)
    mrn = Column(String, nullable=False, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    dob = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    allergies = Column(JSON, nullable=False, default=list)
    current_medications = Column(JSON, nullable=False, default=list)
    conditions = Column(JSON, nullable=False, default=list)
    doctor_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AnalysisRecord(Base):
    __tablename__ = "analysis_results"
    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False, index=True)
    transcript_id = Column(String, nullable=False)
    summary = Column(Text, default="")
    soap_note = Column(JSON, nullable=False, default=dict)
    medications = Column(JSON, nullable=False, default=list)
    diagnoses = Column(JSON, nullable=False, default=list)
    follow_up = Column(JSON, nullable=True)
    key_points = Column(JSON, nullable=False, default=list)
    patient_instructions = Column(Text, nullable=True)
    model_used = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


def create_db_engine():
    def _build_engine(url: str):
        kwargs = {"connect_args": {}} if url.startswith("sqlite") else {}
        if url.startswith("sqlite"):
            kwargs["connect_args"]["check_same_thread"] = False
        else:
            kwargs.update(
                pool_size=settings.db_pool_size,
                max_overflow=settings.db_max_overflow,
                pool_pre_ping=True,
            )
        return create_engine(url, **kwargs)

    primary_url = settings.database_url
    engine = _build_engine(primary_url)

    if settings.is_development and primary_url.startswith("postgresql"):
        try:
            with engine.connect():
                pass
        except OperationalError as exc:
            fallback_url = "sqlite:///./mediscribe_dev.db"
            logger.warning(
                "PostgreSQL unavailable; using development SQLite fallback",
                database_url=primary_url,
                fallback_url=fallback_url,
                error=str(exc),
            )
            return _build_engine(fallback_url)

    return engine


@lru_cache(maxsize=1)
def get_session_factory():
    engine = create_db_engine()
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)


class DBHandler:
    def __init__(self) -> None:
        self._session_factory = get_session_factory()

    # ── Sessions ──────────────────────────────────────────────────────────────

    def save_session(self, session: PatientSession) -> None:
        with self._session_factory() as db:
            record = SessionRecord(
                id=session.id, title=session.title,
                doctor_id=session.doctor_id, patient_id=session.patient_id,
                status=session.status, duration=session.duration,
                audio_url=session.audio_url, transcript_id=session.transcript_id,
                analysis_id=session.analysis_id, notes=session.notes,
            )
            db.merge(record)
            db.commit()

    def get_session(self, session_id: str) -> PatientSession:
        with self._session_factory() as db:
            record = db.get(SessionRecord, session_id)
            if not record:
                raise NotFoundError(f"Session {session_id} not found")
            return self._record_to_session(record)

    def list_sessions(self, doctor_id: str, limit: int = 50, offset: int = 0) -> list[PatientSession]:
        with self._session_factory() as db:
            stmt = (
                select(SessionRecord)
                .where(SessionRecord.doctor_id == doctor_id)
                .order_by(SessionRecord.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            return [self._record_to_session(r) for r in db.scalars(stmt)]

    # ── Transcripts ───────────────────────────────────────────────────────────

    def get_transcript(self, transcript_id: str) -> Transcript:
        with self._session_factory() as db:
            record = db.get(TranscriptRecord, transcript_id)
            if not record:
                raise NotFoundError(f"Transcript {transcript_id} not found")
            segments = [
                TranscriptSegment(**s) if isinstance(s, dict) else s
                for s in record.segments
            ]
            return Transcript(
                id=record.id,
                session_id=record.session_id,
                raw_text=record.raw_text,
                segments=segments,
                language=record.language,
                word_count=record.word_count,
            )

    def save_transcript(self, transcript: Transcript) -> None:
        with self._session_factory() as db:
            record = TranscriptRecord(
                id=transcript.id, session_id=transcript.session_id,
                raw_text=transcript.raw_text,
                segments=[s.model_dump() for s in transcript.segments],
                language=transcript.language, word_count=transcript.word_count,
            )
            db.merge(record)
            db.commit()

    # ── Analysis ──────────────────────────────────────────────────────────────

    def save_analysis(self, analysis: AnalysisResult) -> None:
        with self._session_factory() as db:
            record = AnalysisRecord(
                id=analysis.id, session_id=analysis.session_id,
                transcript_id=analysis.transcript_id,
                summary=analysis.summary,
                soap_note=analysis.soap_note.model_dump(),
                medications=[m.model_dump() for m in analysis.medications],
                diagnoses=[d.model_dump() for d in analysis.diagnoses],
                follow_up=analysis.follow_up.model_dump() if analysis.follow_up else None,
                key_points=analysis.key_points,
                patient_instructions=analysis.patient_instructions,
                model_used=analysis.model_used,
            )
            db.merge(record)
            db.commit()

    def get_analysis_by_session(self, session_id: str) -> AnalysisResult:
        with self._session_factory() as db:
            stmt = (
                select(AnalysisRecord)
                .where(AnalysisRecord.session_id == session_id)
                .order_by(AnalysisRecord.created_at.desc())
                .limit(1)
            )
            record = db.scalar(stmt)
            if not record:
                raise NotFoundError(f"Analysis for session {session_id} not found")
            return AnalysisResult(
                id=record.id,
                session_id=record.session_id,
                transcript_id=record.transcript_id,
                summary=record.summary,
                soap_note=record.soap_note or {},
                medications=record.medications or [],
                diagnoses=record.diagnoses or [],
                follow_up=record.follow_up,
                key_points=record.key_points or [],
                patient_instructions=record.patient_instructions,
                model_used=record.model_used,
                created_at=record.created_at,
            )

    # ── Patients ──────────────────────────────────────────────────────────────

    def save_patient(self, patient: Patient) -> None:
        with self._session_factory() as db:
            record = PatientRecord(
                id=patient.id, mrn=patient.mrn,
                first_name=patient.first_name, last_name=patient.last_name,
                dob=patient.dob, gender=patient.gender.value if patient.gender else None,
                phone=patient.phone, email=patient.email,
                allergies=patient.allergies,
                current_medications=patient.current_medications,
                conditions=patient.conditions,
                doctor_id=patient.doctor_id,
            )
            db.merge(record)
            db.commit()

    def get_patient(self, patient_id: str) -> Patient:
        with self._session_factory() as db:
            record = db.get(PatientRecord, patient_id)
            if not record:
                raise NotFoundError(f"Patient {patient_id} not found")
            return self._record_to_patient(record)

    def list_patients(self, doctor_id: str, limit: int = 50, offset: int = 0) -> list[Patient]:
        with self._session_factory() as db:
            stmt = (
                select(PatientRecord)
                .where(PatientRecord.doctor_id == doctor_id)
                .order_by(PatientRecord.last_name, PatientRecord.first_name)
                .limit(limit)
                .offset(offset)
            )
            return [self._record_to_patient(r) for r in db.scalars(stmt)]

    def search_patients(self, doctor_id: str, query: str, limit: int = 20) -> list[Patient]:
        from sqlalchemy import or_, func
        with self._session_factory() as db:
            q = query.lower()
            stmt = (
                select(PatientRecord)
                .where(PatientRecord.doctor_id == doctor_id)
                .where(
                    or_(
                        func.lower(PatientRecord.first_name).contains(q),
                        func.lower(PatientRecord.last_name).contains(q),
                        func.lower(PatientRecord.mrn).contains(q),
                        func.lower(PatientRecord.phone).contains(q) if q else False,
                    )
                )
                .order_by(PatientRecord.last_name, PatientRecord.first_name)
                .limit(limit)
            )
            return [self._record_to_patient(r) for r in db.scalars(stmt)]

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _record_to_patient(r: PatientRecord) -> Patient:
        from backend.models.patient import Gender
        return Patient(
            id=r.id, mrn=r.mrn,
            first_name=r.first_name, last_name=r.last_name,
            dob=r.dob,
            gender=Gender(r.gender) if r.gender else None,
            phone=r.phone, email=r.email,
            allergies=r.allergies or [],
            current_medications=r.current_medications or [],
            conditions=r.conditions or [],
            doctor_id=r.doctor_id,
            created_at=r.created_at, updated_at=r.updated_at,
        )

    @staticmethod
    def _record_to_session(r: SessionRecord) -> PatientSession:
        return PatientSession(
            id=r.id, title=r.title, doctor_id=r.doctor_id,
            patient_id=r.patient_id, status=r.status, duration=r.duration,
            audio_url=r.audio_url, transcript_id=r.transcript_id,
            analysis_id=r.analysis_id, notes=r.notes,
            created_at=r.created_at, updated_at=r.updated_at,
        )

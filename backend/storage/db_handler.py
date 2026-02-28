"""
Database handler using DynamoDB single-table design for persisting sessions,
transcripts, and analysis results.

Single-table design pattern:
- PK (Partition Key): Entity type + ID (e.g., "SESSION#abc123", "TRANSCRIPT#xyz789")
- SK (Sort Key): Entity type or relationship (e.g., "METADATA", "DOCTOR#user123")
"""
from __future__ import annotations

from datetime import datetime
from typing import Any
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

from backend.models.patient_session import PatientSession, SessionStatus
from backend.models.transcript import Transcript
from backend.models.analysis_result import AnalysisResult
from backend.utils.logger import get_logger
from backend.utils.error_handler import StorageError, NotFoundError
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


def _decimal_to_float(obj: Any) -> Any:
    """Convert Decimal objects to float for JSON serialization."""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: _decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_decimal_to_float(i) for i in obj]
    return obj


def _python_to_dynamodb(obj: Any) -> Any:
    """Convert Python types to DynamoDB-compatible types."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: _python_to_dynamodb(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_python_to_dynamodb(i) for i in obj]
    return obj


class DBHandler:
    def __init__(self) -> None:
        dynamodb_config = {"region_name": settings.aws_region}
        if settings.dynamodb_endpoint_url and settings.dynamodb_endpoint_url.strip():
            dynamodb_config["endpoint_url"] = settings.dynamodb_endpoint_url
        # Pass credentials explicitly. Only add session token for temp creds (ASIA...)
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            dynamodb_config["aws_access_key_id"] = settings.aws_access_key_id
            dynamodb_config["aws_secret_access_key"] = settings.aws_secret_access_key
            # IAM user creds (AKIA...) don't use session token; temp creds (ASIA...) do
            if settings.aws_session_token and settings.aws_access_key_id.startswith("ASIA"):
                dynamodb_config["aws_session_token"] = settings.aws_session_token
        self.dynamodb = boto3.resource("dynamodb", **dynamodb_config)
        self.table = self.dynamodb.Table(settings.dynamodb_table_name)

    # ── Sessions ──────────────────────────────────────────────────────────────

    def save_session(self, session: PatientSession) -> None:
        try:
            item = {
                "PK": f"SESSION#{session.id}",
                "SK": "METADATA",
                "EntityType": "Session",
                "id": session.id,
                "title": session.title,
                "doctor_id": session.doctor_id,
                "patient_id": session.patient_id or "",
                "status": session.status.value,
                "duration": session.duration,
                "audio_url": session.audio_url or "",
                "transcript_id": session.transcript_id or "",
                "analysis_id": session.analysis_id or "",
                "notes": session.notes or "",
                "created_at": session.created_at.isoformat() if session.created_at else datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            self.table.put_item(Item=item)
            
            # Also create a GSI entry for querying by doctor_id
            gsi_item = {
                "PK": f"DOCTOR#{session.doctor_id}",
                "SK": f"SESSION#{session.created_at.isoformat() if session.created_at else datetime.utcnow().isoformat()}#{session.id}",
                "EntityType": "DoctorSession",
                "session_id": session.id,
                "title": session.title,
                "status": session.status.value,
                "created_at": session.created_at.isoformat() if session.created_at else datetime.utcnow().isoformat(),
            }
            self.table.put_item(Item=gsi_item)
            
        except ClientError as e:
            logger.error("dynamodb_save_session_failed", error=str(e))
            raise StorageError(f"Failed to save session: {e}") from e

    def get_session(self, session_id: str) -> PatientSession:
        try:
            response = self.table.get_item(
                Key={
                    "PK": f"SESSION#{session_id}",
                    "SK": "METADATA"
                }
            )
            if "Item" not in response:
                raise NotFoundError(f"Session {session_id} not found")
            return self._item_to_session(response["Item"])
        except ClientError as e:
            logger.error("dynamodb_get_session_failed", error=str(e))
            raise StorageError(f"Failed to get session: {e}") from e

    def list_sessions(self, doctor_id: str, limit: int = 50, offset: int = 0) -> list[PatientSession]:
        try:
            # Query using the doctor_id pattern
            response = self.table.query(
                KeyConditionExpression=Key("PK").eq(f"DOCTOR#{doctor_id}") & Key("SK").begins_with("SESSION#"),
                ScanIndexForward=False,  # Sort descending (newest first)
                Limit=limit + offset
            )
            
            items = response.get("Items", [])
            
            # If no items found, return empty list (not an error)
            if not items:
                logger.info("no_sessions_found", doctor_id=doctor_id)
                return []
            
            # Apply offset
            items = items[offset:offset + limit]
            
            # Fetch full session details for each
            sessions = []
            for item in items:
                try:
                    session = self.get_session(item["session_id"])
                    sessions.append(session)
                except NotFoundError:
                    logger.warning("session_not_found_in_index", session_id=item.get("session_id"))
                    continue
                except Exception as e:
                    logger.error("error_fetching_session", session_id=item.get("session_id"), error=str(e))
                    continue
            
            return sessions
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error("dynamodb_list_sessions_failed", error=str(e), error_code=error_code, doctor_id=doctor_id)
            # Return empty list instead of raising error for better UX
            return []
        except Exception as e:
            logger.error("unexpected_error_listing_sessions", error=str(e), doctor_id=doctor_id)
            return []

    # ── Transcripts ───────────────────────────────────────────────────────────

    def save_transcript(self, transcript: Transcript) -> None:
        try:
            item = {
                "PK": f"TRANSCRIPT#{transcript.id}",
                "SK": "METADATA",
                "EntityType": "Transcript",
                "id": transcript.id,
                "session_id": transcript.session_id,
                "raw_text": transcript.raw_text,
                "segments": _python_to_dynamodb([s.model_dump() for s in transcript.segments]),
                "language": transcript.language,
                "word_count": transcript.word_count,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            self.table.put_item(Item=item)
        except ClientError as e:
            logger.error("dynamodb_save_transcript_failed", error=str(e))
            raise StorageError(f"Failed to save transcript: {e}") from e

    # ── Analysis ──────────────────────────────────────────────────────────────

    def save_analysis(self, analysis: AnalysisResult) -> None:
        try:
            item = {
                "PK": f"ANALYSIS#{analysis.id}",
                "SK": "METADATA",
                "EntityType": "Analysis",
                "id": analysis.id,
                "session_id": analysis.session_id,
                "transcript_id": analysis.transcript_id,
                "summary": analysis.summary,
                "soap_note": _python_to_dynamodb(analysis.soap_note.model_dump()),
                "medications": _python_to_dynamodb([m.model_dump() for m in analysis.medications]),
                "diagnoses": _python_to_dynamodb([d.model_dump() for d in analysis.diagnoses]),
                "follow_up": _python_to_dynamodb(analysis.follow_up.model_dump() if analysis.follow_up else {}),
                "key_points": analysis.key_points,
                "patient_instructions": analysis.patient_instructions or "",
                "model_used": analysis.model_used,
                "created_at": datetime.utcnow().isoformat(),
            }
            self.table.put_item(Item=item)
        except ClientError as e:
            logger.error("dynamodb_save_analysis_failed", error=str(e))
            raise StorageError(f"Failed to save analysis: {e}") from e

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _item_to_session(item: dict) -> PatientSession:
        item = _decimal_to_float(item)
        return PatientSession(
            id=item["id"],
            title=item["title"],
            doctor_id=item["doctor_id"],
            patient_id=item.get("patient_id") or None,
            status=SessionStatus(item["status"]),
            duration=int(item.get("duration", 0)),
            audio_url=item.get("audio_url") or None,
            transcript_id=item.get("transcript_id") or None,
            analysis_id=item.get("analysis_id") or None,
            notes=item.get("notes") or None,
            created_at=datetime.fromisoformat(item["created_at"]) if item.get("created_at") else None,
            updated_at=datetime.fromisoformat(item["updated_at"]) if item.get("updated_at") else None,
        )

"""
Simple DynamoDB handler - minimal working version.
"""
import boto3
from datetime import datetime
from typing import List, Optional
from decimal import Decimal

from backend.models.patient_session import PatientSession, SessionStatus
from config.settings import get_settings

settings = get_settings()


def decimal_to_float(obj):
    """Convert Decimal to float for JSON."""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj


class SimpleDBHandler:
    """Simple DynamoDB handler with basic operations."""
    
    def __init__(self):
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
        self.table = self.dynamodb.Table(settings.dynamodb_table_name)
    
    def save_session(self, session: PatientSession) -> None:
        """Save a session to DynamoDB."""
        item = {
            'PK': f'SESSION#{session.id}',
            'SK': 'METADATA',
            'id': session.id,
            'title': session.title,
            'doctor_id': session.doctor_id,
            'patient_id': session.patient_id or '',
            'status': session.status.value,
            'duration': session.duration,
            'audio_url': session.audio_url or '',
            'transcript_id': session.transcript_id or '',
            'analysis_id': session.analysis_id or '',
            'notes': session.notes or '',
            'created_at': session.created_at.isoformat() if session.created_at else datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
        }
        self.table.put_item(Item=item)
    
    def get_session(self, session_id: str) -> Optional[PatientSession]:
        """Get a session by ID."""
        try:
            response = self.table.get_item(
                Key={'PK': f'SESSION#{session_id}', 'SK': 'METADATA'}
            )
            if 'Item' not in response:
                return None
            
            item = decimal_to_float(response['Item'])
            return PatientSession(
                id=item['id'],
                title=item['title'],
                doctor_id=item['doctor_id'],
                patient_id=item.get('patient_id') or None,
                status=SessionStatus(item['status']),
                duration=int(item.get('duration', 0)),
                audio_url=item.get('audio_url') or None,
                transcript_id=item.get('transcript_id') or None,
                analysis_id=item.get('analysis_id') or None,
                notes=item.get('notes') or None,
                created_at=datetime.fromisoformat(item['created_at']) if item.get('created_at') else None,
                updated_at=datetime.fromisoformat(item['updated_at']) if item.get('updated_at') else None,
            )
        except Exception as e:
            print(f"Error getting session: {e}")
            return None
    
    def list_sessions(self, doctor_id: str = None, limit: int = 50) -> List[PatientSession]:
        """List all sessions. For now, just scan the table."""
        try:
            # Simple scan - not optimal but works for MVP
            response = self.table.scan(Limit=limit)
            items = response.get('Items', [])
            
            sessions = []
            for item in items:
                if item.get('SK') == 'METADATA' and item['PK'].startswith('SESSION#'):
                    item = decimal_to_float(item)
                    try:
                        session = PatientSession(
                            id=item['id'],
                            title=item['title'],
                            doctor_id=item['doctor_id'],
                            patient_id=item.get('patient_id') or None,
                            status=SessionStatus(item['status']),
                            duration=int(item.get('duration', 0)),
                            audio_url=item.get('audio_url') or None,
                            transcript_id=item.get('transcript_id') or None,
                            analysis_id=item.get('analysis_id') or None,
                            notes=item.get('notes') or None,
                            created_at=datetime.fromisoformat(item['created_at']) if item.get('created_at') else None,
                            updated_at=datetime.fromisoformat(item['updated_at']) if item.get('updated_at') else None,
                        )
                        sessions.append(session)
                    except Exception as e:
                        print(f"Error parsing session: {e}")
                        continue
            
            return sessions
        except Exception as e:
            print(f"Error listing sessions: {e}")
            return []

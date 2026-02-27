"""
Celery task definitions for background pipeline jobs.
Imported lazily by job_manager.py to avoid circular imports.
"""
from __future__ import annotations

from backend.pipeline.job_manager import celery_app
from backend.utils.logger import get_logger

logger = get_logger(__name__)


@celery_app.task(
    name="backend.pipeline.tasks.transcribe_and_analyse",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
)
def transcribe_and_analyse(self, session_id: str, audio_key: str) -> dict:
    """
    Full pipeline task: fetch audio from S3 → transcribe → analyse.
    Runs asynchronously in the Celery worker.
    """
    from backend.storage.s3_handler import S3Handler
    from backend.storage.db_handler import DBHandler
    from backend.pipeline.orchestrator import MedicalPipelineOrchestrator

    logger.info("task_started", task_id=self.request.id, session_id=session_id)

    s3 = S3Handler()
    db = DBHandler()
    orchestrator = MedicalPipelineOrchestrator()

    try:
        session = db.get_session(session_id)

        # Download audio from S3
        audio_obj = s3._client.get_object(Bucket=s3._bucket, Key=audio_key)
        audio_bytes = audio_obj["Body"].read()
        ext = audio_key.rsplit(".", 1)[-1] if "." in audio_key else "wav"

        transcript, analysis = orchestrator.process_recording(session, audio_bytes, audio_format=ext)

        db.save_transcript(transcript)
        db.save_analysis(analysis)
        db.save_session(session)

        logger.info(
            "task_complete",
            session_id=session_id,
            transcript_id=transcript.id,
            analysis_id=analysis.id,
        )
        return {"session_id": session_id, "transcript_id": transcript.id, "analysis_id": analysis.id}

    except Exception as exc:
        logger.error("task_failed", session_id=session_id, error=str(exc))
        raise self.retry(exc=exc)


@celery_app.task(
    name="backend.pipeline.tasks.analyse_transcript",
    bind=True,
    max_retries=2,
    default_retry_delay=15,
)
def analyse_transcript(self, session_id: str, transcript_id: str) -> dict:
    """
    Run analysis only on an existing transcript (re-analyse or retry).
    """
    from backend.storage.db_handler import DBHandler
    from backend.pipeline.orchestrator import MedicalPipelineOrchestrator
    from backend.models.transcript import Transcript

    logger.info("analyse_task_started", session_id=session_id, transcript_id=transcript_id)

    db = DBHandler()
    orchestrator = MedicalPipelineOrchestrator()

    try:
        session = db.get_session(session_id)
        # Minimal transcript shell — orchestrator only needs session + transcript.id
        transcript = Transcript(id=transcript_id, session_id=session_id, raw_text="", segments=[])
        analysis = orchestrator._run_analysis(session, transcript)

        db.save_analysis(analysis)
        logger.info("analyse_task_complete", analysis_id=analysis.id)
        return {"analysis_id": analysis.id}

    except Exception as exc:
        logger.error("analyse_task_failed", session_id=session_id, error=str(exc))
        raise self.retry(exc=exc)

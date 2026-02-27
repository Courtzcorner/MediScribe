"""
Celery-based background job manager for async transcription/analysis tasks.
"""
from __future__ import annotations

from celery import Celery
from config.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "mediscribe",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["backend.pipeline.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "backend.pipeline.tasks.transcribe_and_analyse": {"queue": "pipeline"},
        "backend.pipeline.tasks.analyse_transcript": {"queue": "analysis"},
    },
)


class JobStatus:
    PENDING = "PENDING"
    STARTED = "STARTED"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"


def submit_pipeline_job(session_id: str, audio_key: str) -> str:
    """
    Submit an async pipeline job. Returns the Celery task ID.
    Import here to avoid circular imports at module load time.
    """
    from backend.pipeline.tasks import transcribe_and_analyse  # noqa: PLC0415
    task = transcribe_and_analyse.apply_async(
        kwargs={"session_id": session_id, "audio_key": audio_key},
        queue="pipeline",
    )
    return task.id


def get_job_status(task_id: str) -> dict:
    """Return the current status and result of a Celery task."""
    result = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": result.status,
        "result": result.result if result.successful() else None,
        "error": str(result.result) if result.failed() else None,
    }

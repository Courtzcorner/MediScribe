"""
Amazon Transcribe client for speech-to-text.

Uses Amazon Transcribe for batch STT with speaker diarization (Doctor/Patient).
Nova Sonic 2 (amazon.nova-2-sonic-v1:0) requires HTTP/2 bidirectional streaming
which is not yet supported by the boto3 SDK — Transcribe is used instead.
"""
from __future__ import annotations

import json
import time
import urllib.request
import uuid

import boto3
from botocore.exceptions import ClientError

from backend.models.transcript import Transcript, TranscriptSegment, SpeakerRole
from backend.utils.logger import get_logger
from backend.utils.error_handler import TranscriptionError
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class NovaTranscribeClient:
    """
    Wraps Amazon Transcribe for medical-grade batch STT.
    Supports speaker diarization (doctor vs patient).
    """

    def __init__(self) -> None:
        kwargs: dict = {"region_name": settings.aws_region}
        if settings.aws_access_key_id:
            kwargs["aws_access_key_id"] = settings.aws_access_key_id
            kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        self._client = boto3.client("transcribe", **kwargs)

    def transcribe(self, audio_bytes: bytes, session_id: str, audio_s3_uri: str | None = None) -> Transcript:
        """
        Transcribe audio using Amazon Transcribe.
        audio_s3_uri must point to the already-uploaded S3 WAV file.
        """
        if not audio_s3_uri:
            raise TranscriptionError("audio_s3_uri is required for Transcribe")

        logger.info(
            "transcription_start",
            session_id=session_id,
            uri=audio_s3_uri,
        )
        job_name = self._start_job(audio_s3_uri, session_id)
        raw = self._wait(job_name)
        transcript = self._parse(raw, session_id)
        logger.info("transcription_complete", session_id=session_id, segments=len(transcript.segments))
        return transcript

    # ── Private ───────────────────────────────────────────────────────────────

    def _start_job(self, s3_uri: str, session_id: str) -> str:
        job_name = f"mediscribe-{session_id}-{uuid.uuid4().hex[:8]}"
        try:
            self._client.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={"MediaFileUri": s3_uri},
                MediaFormat="wav",
                LanguageCode=settings.transcribe_language_code,
                Settings={
                    "ShowSpeakerLabels": True,
                    "MaxSpeakerLabels": 2,
                    "ShowAlternatives": False,
                },
            )
        except ClientError as e:
            raise TranscriptionError(f"Failed to start Transcribe job: {e}") from e
        logger.info("transcribe_job_started", job_name=job_name)
        return job_name

    def _wait(self, job_name: str, poll: int = 5, timeout: int = 600) -> dict:
        elapsed = 0
        while elapsed < timeout:
            resp = self._client.get_transcription_job(TranscriptionJobName=job_name)
            job = resp["TranscriptionJob"]
            status = job["TranscriptionJobStatus"]
            if status == "COMPLETED":
                uri = job["Transcript"].get(
                    "RedactedTranscriptFileUri",
                    job["Transcript"]["TranscriptFileUri"],
                )
                with urllib.request.urlopen(uri) as r:
                    return json.loads(r.read())
            if status == "FAILED":
                raise TranscriptionError(f"Transcribe job failed: {job.get('FailureReason')}")
            time.sleep(poll)
            elapsed += poll
        raise TranscriptionError(f"Transcribe job timed out after {timeout}s")

    def _parse(self, result: dict, session_id: str) -> Transcript:
        items = result.get("results", {}).get("items", [])
        spk_segs = result.get("results", {}).get("speaker_labels", {}).get("segments", [])

        speaker_map: dict[tuple[float, float], str] = {}
        for seg in spk_segs:
            for item in seg.get("items", []):
                key = (float(item.get("start_time", 0)), float(item.get("end_time", 0)))
                speaker_map[key] = seg.get("speaker_label", "spk_0")

        segments: list[TranscriptSegment] = []
        cur_spk: str | None = None
        cur_words: list[str] = []
        cur_start = cur_end = 0.0

        for item in items:
            if item["type"] == "punctuation":
                if cur_words:
                    cur_words[-1] += item["alternatives"][0]["content"]
                continue
            start = float(item.get("start_time", cur_end))
            end = float(item.get("end_time", start))
            word = item["alternatives"][0]["content"]
            spk = speaker_map.get((start, end), cur_spk or "spk_0")

            if spk != cur_spk and cur_words:
                segments.append(TranscriptSegment(
                    speaker=_map_speaker(cur_spk or "spk_0"),
                    text=" ".join(cur_words),
                    start_time=cur_start,
                    end_time=cur_end,
                    confidence=float(item["alternatives"][0].get("confidence", 1.0)),
                ))
                cur_words = []
                cur_start = start

            cur_spk = spk
            cur_words.append(word)
            cur_end = end

        if cur_words:
            segments.append(TranscriptSegment(
                speaker=_map_speaker(cur_spk or "spk_0"),
                text=" ".join(cur_words),
                start_time=cur_start,
                end_time=cur_end,
            ))

        return Transcript.from_segments(session_id, segments)


def _map_speaker(label: str) -> SpeakerRole:
    if label == "spk_0":
        return SpeakerRole.DOCTOR
    if label == "spk_1":
        return SpeakerRole.PATIENT
    return SpeakerRole.UNKNOWN

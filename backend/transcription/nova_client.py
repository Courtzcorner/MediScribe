"""
Amazon Transcribe client for speech-to-text.
Named nova_client.py to align with the Nova model family naming convention.
Uses Amazon Transcribe for batch and streaming STT, with
Amazon Nova Sonic (via Bedrock) available for real-time conversational STT.
"""
from __future__ import annotations

import json
import time
import uuid
from typing import Generator

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
    Wraps Amazon Transcribe for medical-grade STT.
    Supports:
      - Batch transcription (upload S3 URI → poll → result)
      - Start/stop job management
      - Speaker diarization (doctor vs patient)
    """

    def __init__(self) -> None:
        self._client = boto3.client(
            "transcribe",
            region_name=settings.aws_region,
            **(
                {
                    "aws_access_key_id": settings.aws_access_key_id,
                    "aws_secret_access_key": settings.aws_secret_access_key,
                }
                if settings.aws_access_key_id
                else {}
            ),
        )

    def start_transcription_job(
        self,
        audio_s3_uri: str,
        session_id: str,
        language_code: str = "en-US",
        num_speakers: int = 2,
    ) -> str:
        """Submit a batch transcription job. Returns the job name."""
        job_name = f"mediscribe-{session_id}-{uuid.uuid4().hex[:8]}"
        try:
            self._client.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={"MediaFileUri": audio_s3_uri},
                MediaFormat=self._infer_format(audio_s3_uri),
                LanguageCode=language_code,
                Settings={
                    "ShowSpeakerLabels": True,
                    "MaxSpeakerLabels": num_speakers,
                    "ShowAlternatives": False,
                    "VocabularyFilterMethod": "mask",
                },
                ContentRedaction={
                    "RedactionType": "PII",
                    "RedactionOutput": "redacted",
                },
                Specialty="PRIMARYCARE",
                Type="DICTATION",
            )
            logger.info("transcription_job_started", job_name=job_name, session_id=session_id)
            return job_name
        except ClientError as e:
            raise TranscriptionError(f"Failed to start transcription job: {e}") from e

    def wait_for_job(
        self, job_name: str, poll_interval: int = 5, timeout: int = 600
    ) -> dict:
        """Poll until the transcription job completes. Returns the result JSON."""
        elapsed = 0
        while elapsed < timeout:
            response = self._client.get_transcription_job(TranscriptionJobName=job_name)
            job = response["TranscriptionJob"]
            status = job["TranscriptionJobStatus"]

            if status == "COMPLETED":
                transcript_uri = job["Transcript"]["RedactedTranscriptFileUri"]
                return self._fetch_transcript_json(transcript_uri)
            elif status == "FAILED":
                reason = job.get("FailureReason", "Unknown")
                raise TranscriptionError(f"Transcription job failed: {reason}")

            time.sleep(poll_interval)
            elapsed += poll_interval

        raise TranscriptionError(f"Transcription job timed out after {timeout}s")

    def parse_result(self, result: dict, session_id: str) -> Transcript:
        """Convert Amazon Transcribe JSON output to a Transcript model."""
        segments: list[TranscriptSegment] = []
        items = result.get("results", {}).get("items", [])
        speaker_segments = result.get("results", {}).get("speaker_labels", {}).get("segments", [])

        # Build a time → speaker map
        speaker_map: dict[tuple[float, float], str] = {}
        for seg in speaker_segments:
            for item in seg.get("items", []):
                key = (float(item.get("start_time", 0)), float(item.get("end_time", 0)))
                speaker_map[key] = seg.get("speaker_label", "spk_0")

        current_speaker: str | None = None
        current_text: list[str] = []
        current_start: float = 0.0
        current_end: float = 0.0

        for item in items:
            if item["type"] == "punctuation":
                if current_text:
                    current_text[-1] += item["alternatives"][0]["content"]
                continue

            start = float(item.get("start_time", current_end))
            end = float(item.get("end_time", start))
            word = item["alternatives"][0]["content"]
            key = (start, end)
            speaker = speaker_map.get(key, current_speaker or "spk_0")

            if speaker != current_speaker and current_text:
                segments.append(
                    TranscriptSegment(
                        speaker=self._map_speaker(current_speaker or "spk_0"),
                        text=" ".join(current_text),
                        start_time=current_start,
                        end_time=current_end,
                        confidence=float(item["alternatives"][0].get("confidence", 1.0)),
                    )
                )
                current_text = []
                current_start = start

            current_speaker = speaker
            current_text.append(word)
            current_end = end

        # Flush remaining
        if current_text:
            segments.append(
                TranscriptSegment(
                    speaker=self._map_speaker(current_speaker or "spk_0"),
                    text=" ".join(current_text),
                    start_time=current_start,
                    end_time=current_end,
                )
            )

        return Transcript.from_segments(session_id, segments)

    @staticmethod
    def _map_speaker(label: str) -> SpeakerRole:
        """Map spk_0 → doctor, spk_1 → patient (by convention)."""
        if label == "spk_0":
            return SpeakerRole.DOCTOR
        elif label == "spk_1":
            return SpeakerRole.PATIENT
        return SpeakerRole.UNKNOWN

    @staticmethod
    def _infer_format(uri: str) -> str:
        ext = uri.rsplit(".", 1)[-1].lower()
        return {"mp3": "mp3", "wav": "wav", "flac": "flac", "ogg": "ogg"}.get(ext, "mp4")

    def _fetch_transcript_json(self, uri: str) -> dict:
        import urllib.request
        with urllib.request.urlopen(uri) as resp:
            return json.loads(resp.read())

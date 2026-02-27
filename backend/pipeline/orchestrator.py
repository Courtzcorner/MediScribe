"""
Orchestrator: ties transcription → formatting → analysis together
into a single async pipeline for a recording session.
"""
from __future__ import annotations

from collections.abc import Generator

from backend.models.patient_session import PatientSession
from backend.models.transcript import Transcript
from backend.models.analysis_result import AnalysisResult
from backend.transcription.nova_client import NovaTranscribeClient
from backend.transcription.audio_preprocessor import AudioPreprocessor
from backend.transcription.transcript_formatter import TranscriptFormatter
from backend.analysis.claude_client import ClaudeClient
from backend.analysis.response_parser import ResponseParser
from backend.storage.s3_handler import S3Handler
from backend.storage.db_handler import DBHandler
from backend.utils.logger import get_logger
from backend.utils.error_handler import TranscriptionError, AnalysisError
from config.settings import get_settings
from config.bedrock_config import CLAUDE_MODEL_ID

logger = get_logger(__name__)
settings = get_settings()


class MedicalPipelineOrchestrator:
    """End-to-end pipeline: audio → transcript → analysis."""

    def __init__(self) -> None:
        self.transcriber = NovaTranscribeClient()
        self.preprocessor = AudioPreprocessor()
        self.formatter = TranscriptFormatter()
        self.claude = ClaudeClient()
        self.parser = ResponseParser()
        self.s3 = S3Handler()

    def process_recording(
        self,
        session: PatientSession,
        audio_bytes: bytes,
        audio_format: str = "webm",
    ) -> tuple[Transcript, AnalysisResult]:
        """
        Full synchronous pipeline.
        1. Preprocess audio
        2. Upload to S3
        3. Transcribe
        4. Format transcript
        5. Analyse with Claude
        Returns (Transcript, AnalysisResult).
        """
        session.mark_processing()
        logger.info("pipeline_start", session_id=session.id)

        try:
            # 1. Convert audio to WAV
            wav_bytes = self.preprocessor.preprocess(audio_bytes, audio_format)
            duration = self.preprocessor.get_duration(wav_bytes)
            session.duration = int(duration)

            # 2. Upload audio to S3
            audio_key = f"audio/{session.id}.wav"
            audio_uri = self.s3.upload_audio(wav_bytes, audio_key)
            session.audio_url = audio_uri
            logger.info("audio_uploaded", session_id=session.id, key=audio_key)

            # 3. Transcribe
            job_name = self.transcriber.start_transcription_job(audio_uri, session.id)
            raw_result = self.transcriber.wait_for_job(job_name)
            transcript = self.transcriber.parse_result(raw_result, session.id)

            # 4. Format
            transcript = self.formatter.format(transcript)
            logger.info("transcription_complete", session_id=session.id, words=transcript.word_count)

            # 5. Analyse
            analysis = self._run_analysis(session, transcript)
            logger.info("analysis_complete", session_id=session.id, analysis_id=analysis.id)

            session.mark_completed(transcript.id, analysis.id)
            return transcript, analysis

        except (TranscriptionError, AnalysisError):
            session.mark_failed()
            raise
        except Exception as e:
            session.mark_failed()
            raise AnalysisError(f"Pipeline failed unexpectedly: {e}") from e

    def stream_analysis(
        self,
        session: PatientSession,
        transcript: Transcript,
    ) -> Generator[str, None, AnalysisResult]:
        """
        Run Claude analysis in streaming mode.
        Yields text chunks, then returns the final AnalysisResult.
        """
        system_prompt = self._load_system_prompt()
        user_message = self._build_analysis_prompt(transcript)

        full_response = ""
        for chunk in self.claude.stream(system_prompt, user_message):
            full_response += chunk
            yield chunk

        analysis = self.parser.parse(full_response, session.id, transcript.id, CLAUDE_MODEL_ID)
        # Persist analysis so it can be fetched later
        # ensures streamed responses are also saved by the DB
        DBHandler().save_analysis(analysis)
        return analysis

    # ── Private ───────────────────────────────────────────────────────────────

    def _run_analysis(self, session: PatientSession, transcript: Transcript) -> AnalysisResult:
        system_prompt = self._load_system_prompt()
        user_message = self._build_analysis_prompt(transcript)
        raw = self.claude.invoke(system_prompt, user_message)
        analysis = self.parser.parse(raw, session.id, transcript.id, CLAUDE_MODEL_ID)
        # Persist analysis so it can be fetched later; links Claude output to the session 
        DBHandler().save_analysis(analysis)
        return analysis

    @staticmethod
    def _load_system_prompt() -> str:
        try:
            with open("backend/analysis/prompts/system_prompt.txt") as f:
                return f.read()
        except FileNotFoundError:
            return (
                "You are a clinical documentation AI. Analyse the medical conversation "
                "and return a JSON object with summary, soap_note, medications, diagnoses, "
                "follow_up, key_points, and patient_instructions."
            )

    @staticmethod
    def _build_analysis_prompt(transcript: Transcript) -> str:
        readable = "\n".join(
            f"[{s.speaker.value.upper()}]: {s.text}" for s in transcript.segments
        )
        return (
            f"Please analyse the following medical consultation transcript and return "
            f"a structured JSON response.\n\n"
            f"TRANSCRIPT:\n{readable}\n\n"
            f"Return only valid JSON, no additional text outside the JSON block."
        )

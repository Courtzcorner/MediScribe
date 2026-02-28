from __future__ import annotations

from collections.abc import Generator

from backend.analysis.claude_client import ClaudeClient
from backend.analysis.response_parser import ResponseParser
from backend.models.analysis_result import AnalysisResult
from backend.models.patient_session import PatientSession
from backend.models.transcript import Transcript
from backend.utils.logger import get_logger
from config.bedrock_config import CLAUDE_MODEL_ID

logger = get_logger(__name__)


MEDICAL_SYSTEM_PROMPT = """
You are an AI assistant helping clinicians draft visit documentation and
clinical thinking. You are NOT making diagnoses or treatment decisions.

Given a transcript of a doctor–patient encounter, analyse it and return a
JSON object with the following top-level shape:

{
  "soap_note": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "suggested_questions": [
    "Follow-up question 1",
    "Follow-up question 2"
  ],
  "key_findings": [
    "Salient clinical finding 1",
    "Salient clinical finding 2"
  ],
  "red_flags": [
    "Potentially serious symptom or sign that warrants urgent attention"
  ],
  "icd10_suggestions": [
    "ICD-10-CM code and short label, e.g. 'R07.9 – Chest pain, unspecified'"
  ],
  "disclaimer": "Clear statement that this is not a diagnosis and does not replace clinician judgment."
}

Important instructions:
- ALWAYS frame content as physician considerations and documentation support,
  never as definitive diagnoses or treatment orders.
- PROMINENTLY surface any red flag symptoms or signs in the `red_flags` array.
- If information is missing, state that explicitly rather than guessing.
- Keep language concise, clinically oriented, and suitable for a SOAP note.
- Return ONLY JSON, without any surrounding markdown or explanation.
""".strip()


class MedicalAnalyzer:
    """
    High-level façade around Claude for medical transcript analysis.

    Provides both non-streaming and streaming interfaces that:
    - use a clinically focused system prompt
    - return structured JSON mapped into AnalysisResult models
    """

    def __init__(
        self,
        claude_client: ClaudeClient | None = None,
        parser: ResponseParser | None = None,
        model_id: str | None = None,
    ) -> None:
        self._client = claude_client or ClaudeClient()
        self._parser = parser or ResponseParser()
        self._model_id = model_id or CLAUDE_MODEL_ID

    # ── Public API ────────────────────────────────────────────────────────────

    def analyze_transcript(self, session: PatientSession, transcript: Transcript) -> AnalysisResult:
        """
        Run a full, non-streaming analysis and return an AnalysisResult.
        """
        system_prompt = MEDICAL_SYSTEM_PROMPT
        user_message = self._build_analysis_prompt(transcript)

        logger.info(
            "medical_analysis_invoke",
            extra={"session_id": session.id, "transcript_id": transcript.id, "model": self._model_id},
        )

        raw = self._client.invoke(system_prompt, user_message)
        return self._parser.parse(raw, session.id, transcript.id, self._model_id)

    def analyze_transcript_stream(
        self,
        session: PatientSession,
        transcript: Transcript,
    ) -> Generator[str, None, None]:
        """
        Streaming analysis interface.

        Yields raw text chunks from Claude as they arrive. Callers that need a
        structured AnalysisResult should concatenate the chunks and pass the
        full text back through ResponseParser.
        """
        system_prompt = MEDICAL_SYSTEM_PROMPT
        user_message = self._build_analysis_prompt(transcript)

        logger.info(
            "medical_analysis_stream",
            extra={"session_id": session.id, "transcript_id": transcript.id, "model": self._model_id},
        )

        yield from self._client.stream(system_prompt, user_message)

    def parse_response(
        self,
        raw_text: str,
        session: PatientSession,
        transcript: Transcript,
    ) -> AnalysisResult:
        """
        Convenience helper to turn a raw model response into an AnalysisResult.
        """
        return self._parser.parse(raw_text, session.id, transcript.id, self._model_id)

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _build_analysis_prompt(transcript: Transcript) -> str:
        """
        Render the transcript into a readable doctor/patient dialogue block
        suitable for Claude, preserving speaker roles where available.
        """
        readable = "\n".join(
            f"[{segment.speaker.value.upper()}]: {segment.text}" for segment in transcript.segments
        )
        return (
            "Analyse the following medical consultation transcript and produce the JSON "
            "object described in the system prompt. Do not include any text outside the "
            "JSON object.\n\n"
            "TRANSCRIPT:\n"
            f"{readable}"
        )


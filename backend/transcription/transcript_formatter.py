"""
Post-process raw transcript text: normalise whitespace,
fix medical abbreviations, assign speaker labels, and
produce a clean human-readable string.
"""
from __future__ import annotations

import re

from backend.models.transcript import Transcript, TranscriptSegment, SpeakerRole
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Common medical abbreviations to expand for readability
MEDICAL_ABBREVIATIONS: dict[str, str] = {
    r"\bbid\b": "twice daily",
    r"\btid\b": "three times daily",
    r"\bqid\b": "four times daily",
    r"\bprn\b": "as needed",
    r"\bpo\b": "by mouth",
    r"\biv\b": "intravenous",
    r"\bim\b": "intramuscular",
    r"\bsc\b": "subcutaneous",
    r"\bbp\b": "blood pressure",
    r"\bhr\b": "heart rate",
    r"\brr\b": "respiratory rate",
    r"\bo2sat\b": "oxygen saturation",
    r"\bcc\b": "chief complaint",
    r"\bhx\b": "history",
    r"\bfhx\b": "family history",
    r"\bshx\b": "social history",
    r"\brx\b": "prescription",
    r"\bdx\b": "diagnosis",
    r"\btx\b": "treatment",
    r"\bwbc\b": "white blood cell count",
    r"\brbc\b": "red blood cell count",
    r"\bnpo\b": "nothing by mouth",
}


class TranscriptFormatter:
    """Clean and enrich a Transcript after STT."""

    def format(self, transcript: Transcript) -> Transcript:
        """
        Apply all formatting steps to the transcript in-place.
        Returns the modified transcript.
        """
        formatted_segments: list[TranscriptSegment] = []
        for seg in transcript.segments:
            text = self._clean_whitespace(seg.text)
            text = self._expand_abbreviations(text)
            text = self._fix_sentence_case(text)
            formatted_segments.append(seg.model_copy(update={"text": text}))

        transcript.segments = formatted_segments
        transcript.raw_text = self._build_raw_text(formatted_segments)
        transcript.word_count = len(transcript.raw_text.split())
        return transcript

    def to_readable_string(self, transcript: Transcript) -> str:
        """Return a formatted string with speaker labels for display."""
        lines: list[str] = []
        for seg in transcript.segments:
            label = self._speaker_label(seg.speaker)
            timestamp = self._format_time(seg.start_time)
            lines.append(f"[{timestamp}] {label}: {seg.text}")
        return "\n".join(lines)

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _clean_whitespace(text: str) -> str:
        text = text.strip()
        text = re.sub(r"\s+", " ", text)
        return text

    @staticmethod
    def _expand_abbreviations(text: str) -> str:
        for pattern, replacement in MEDICAL_ABBREVIATIONS.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        return text

    @staticmethod
    def _fix_sentence_case(text: str) -> str:
        if not text:
            return text
        return text[0].upper() + text[1:]

    @staticmethod
    def _build_raw_text(segments: list[TranscriptSegment]) -> str:
        return " ".join(s.text for s in segments)

    @staticmethod
    def _speaker_label(role: SpeakerRole) -> str:
        return {"doctor": "Doctor", "patient": "Patient", "unknown": "Unknown"}[role.value]

    @staticmethod
    def _format_time(seconds: float) -> str:
        m, s = divmod(int(seconds), 60)
        return f"{m:02d}:{s:02d}"

"""
Parse Claude's JSON output into strongly-typed AnalysisResult models.

Claude is instructed to return structured JSON; this module:
- strips markdown code fences
- tolerates mildly malformed JSON where possible
- falls back gracefully to a minimal AnalysisResult if parsing fails.
"""
from __future__ import annotations

import json
import re

from backend.models.analysis_result import (
    AnalysisResult,
    SOAPNote,
    Medication,
    Diagnosis,
    FollowUp,
    Severity,
    DiagnosisStatus,
)
from backend.utils.logger import get_logger

logger = get_logger(__name__)


class ResponseParser:
    """Extract and validate structured data from Claude's text output."""

    def parse(self, raw_text: str, session_id: str, transcript_id: str, model_id: str) -> AnalysisResult:
        """
        Parse *raw_text* (Claude's full response) into an AnalysisResult.

        Expects a JSON block wrapped in ```json ... ``` or bare JSON, but will:
        - strip common markdown code fences
        - attempt to locate the first {...} block
        - fall back to a minimal AnalysisResult if JSON is not parseable.
        """
        json_str = self._extract_json(raw_text)

        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            # Log and fall back rather than raising; this keeps the pipeline
            # usable even if the model emits slightly malformed JSON.
            logger.error("json_parse_failed", raw=raw_text[:500], error=str(e))
            return AnalysisResult(
                session_id=session_id,
                transcript_id=transcript_id,
                model_used=model_id,
                summary=raw_text.strip(),
                disclaimer=(
                    "AI-generated content could not be parsed as structured JSON. "
                    "Treat this summary as rough notes only and rely on clinician "
                    "judgment and formal documentation."
                ),
            )

        return AnalysisResult(
            session_id=session_id,
            transcript_id=transcript_id,
            model_used=model_id,
            summary=data.get("summary", ""),
            soap_note=self._parse_soap(data.get("soap_note", {})),
            medications=self._parse_medications(data.get("medications", [])),
            diagnoses=self._parse_diagnoses(data.get("diagnoses", [])),
            follow_up=self._parse_follow_up(data.get("follow_up")),
            key_points=data.get("key_points", []),
            patient_instructions=data.get("patient_instructions"),
            suggested_questions=data.get("suggested_questions", []) or [],
            key_findings=data.get("key_findings", []) or [],
            red_flags=data.get("red_flags", []) or [],
            icd10_suggestions=data.get("icd10_suggestions", []) or [],
            disclaimer=data.get("disclaimer"),
        )

    # ── Private ───────────────────────────────────────────────────────────────

    @staticmethod
    def _extract_json(text: str) -> str:
        """Extract a JSON object from raw model text, stripping code fences."""
        # Normalise whitespace
        stripped = text.strip()

        # Try to find a ```json ... ``` or ``` ... ``` fenced block first
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", stripped, re.DOTALL)
        if match:
            return match.group(1).strip()

        # Fall back to finding the first { ... } block
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start != -1 and end != -1 and end > start:
            return stripped[start : end + 1].strip()

        # As a last resort, return the raw text; caller will attempt json.loads
        return stripped

    @staticmethod
    def _parse_soap(data: dict) -> SOAPNote:
        return SOAPNote(
            subjective=data.get("subjective", ""),
            objective=data.get("objective", ""),
            assessment=data.get("assessment", ""),
            plan=data.get("plan", ""),
        )

    @staticmethod
    def _parse_medications(items: list[dict]) -> list[Medication]:
        result: list[Medication] = []
        for item in items:
            try:
                result.append(
                    Medication(
                        name=item["name"],
                        dosage=item.get("dosage", ""),
                        frequency=item.get("frequency", ""),
                        duration=item.get("duration"),
                        route=item.get("route"),
                        instructions=item.get("instructions"),
                    )
                )
            except (KeyError, TypeError) as e:
                logger.warning("medication_parse_skip", item=item, error=str(e))
        return result

    @staticmethod
    def _parse_diagnoses(items: list[dict]) -> list[Diagnosis]:
        result: list[Diagnosis] = []
        for item in items:
            try:
                severity_raw = item.get("severity")
                status_raw = item.get("status", "new")
                result.append(
                    Diagnosis(
                        condition=item["condition"],
                        icd_code=item.get("icd_code"),
                        severity=Severity(severity_raw) if severity_raw else None,
                        status=DiagnosisStatus(status_raw),
                        notes=item.get("notes"),
                    )
                )
            except (KeyError, TypeError, ValueError) as e:
                logger.warning("diagnosis_parse_skip", item=item, error=str(e))
        return result

    @staticmethod
    def _parse_follow_up(data: dict | None) -> FollowUp | None:
        if not data:
            return None
        try:
            return FollowUp(
                timeframe=data["timeframe"],
                instructions=data.get("instructions", ""),
                referrals=data.get("referrals", []),
                lab_orders=data.get("lab_orders", []),
                imaging_orders=data.get("imaging_orders", []),
            )
        except (KeyError, TypeError):
            return None

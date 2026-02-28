"""
Parse Claude's JSON output into strongly-typed AnalysisResult models.
Claude is instructed to return structured JSON; this module validates it.
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
from backend.utils.error_handler import AnalysisError

logger = get_logger(__name__)


class ResponseParser:
    """Extract and validate structured data from Claude's text output."""

    def parse(self, raw_text: str, session_id: str, transcript_id: str, model_id: str) -> AnalysisResult:
        """
        Parse *raw_text* (Claude's full response) into an AnalysisResult.
        Expects a JSON block wrapped in ```json ... ``` or bare JSON.
        """
        json_str = self._extract_json(raw_text)
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.error("json_parse_failed", raw=raw_text[:500], error=str(e))
            raise AnalysisError(f"Failed to parse Claude response as JSON: {e}") from e

        if not isinstance(data, dict):
            raise AnalysisError("Claude response JSON must be an object")

        key_points = data.get("key_points", [])
        if not isinstance(key_points, list):
            key_points = []

        return AnalysisResult(
            session_id=session_id,
            transcript_id=transcript_id,
            model_used=model_id,
            summary=data.get("summary", ""),
            soap_note=self._parse_soap(data.get("soap_note", {})),
            medications=self._parse_medications(data.get("medications", [])),
            diagnoses=self._parse_diagnoses(data.get("diagnoses", [])),
            follow_up=self._parse_follow_up(data.get("follow_up")),
            key_points=key_points,
            patient_instructions=data.get("patient_instructions"),
        )

    # ── Private ───────────────────────────────────────────────────────────────

    @staticmethod
    def _extract_json(text: str) -> str:
        # Try to find a JSON code block first
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            return match.group(1)
        # Fall back to finding the first { ... } block
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return text[start : end + 1]
        return text  # Let json.loads raise the error

    @staticmethod
    def _parse_soap(data: dict | None) -> SOAPNote:
        if not isinstance(data, dict):
            data = {}
        return SOAPNote(
            subjective=data.get("subjective", ""),
            objective=data.get("objective", ""),
            assessment=data.get("assessment", ""),
            plan=data.get("plan", ""),
        )

    @staticmethod
    def _parse_medications(items: list[dict] | None) -> list[Medication]:
        if not isinstance(items, list):
            return []
        result = []
        for item in items:
            if not isinstance(item, dict):
                logger.warning("medication_parse_skip", item=item, error="Item is not an object")
                continue
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
    def _parse_diagnoses(items: list[dict] | None) -> list[Diagnosis]:
        if not isinstance(items, list):
            return []
        result = []
        for item in items:
            if not isinstance(item, dict):
                logger.warning("diagnosis_parse_skip", item=item, error="Item is not an object")
                continue
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
        if not data or not isinstance(data, dict):
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

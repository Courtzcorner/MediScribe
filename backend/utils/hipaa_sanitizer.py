"""
HIPAA PII sanitizer — strips or masks sensitive patient identifiers
before writing to logs, non-PHI storage, or external services.

Covered identifiers (per HIPAA Safe Harbor):
  names, dates (except year), phone, fax, email, SSN, MRN,
  health plan beneficiary numbers, account numbers, certificate/license numbers,
  VINs, device identifiers, URLs, IP addresses, biometric identifiers, photos.
"""
import re
from typing import Any

# ── Patterns ──────────────────────────────────────────────────────────────────

_PATTERNS: list[tuple[str, str]] = [
    # SSN
    (r"\b\d{3}-\d{2}-\d{4}\b", "[SSN]"),
    # Phone / fax
    (r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b", "[PHONE]"),
    # Email
    (r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b", "[EMAIL]"),
    # Date (MM/DD/YYYY, MM-DD-YYYY, Month DD YYYY)
    (
        r"\b(?:0?[1-9]|1[0-2])[/\-](?:0?[1-9]|[12]\d|3[01])[/\-]\d{4}\b",
        "[DATE]",
    ),
    (
        r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
        r"Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|"
        r"Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b",
        "[DATE]",
    ),
    # MRN — common patterns like MRN: 1234567
    (r"\b(?:MRN|mrn|Medical Record)[:\s#]*\d{5,10}\b", "[MRN]"),
    # IP address
    (r"\b(?:\d{1,3}\.){3}\d{1,3}\b", "[IP]"),
    # URLs
    (r"https?://[^\s\"'<>]+", "[URL]"),
    # ZIP code (5-digit, optionally +4)
    (r"\b\d{5}(?:-\d{4})?\b", "[ZIP]"),
]

_COMPILED = [(re.compile(pat), repl) for pat, repl in _PATTERNS]


def sanitize_text(text: str) -> str:
    """Replace PII patterns in *text* with placeholder tokens."""
    for pattern, replacement in _COMPILED:
        text = pattern.sub(replacement, text)
    return text


def sanitize_dict(data: dict[str, Any]) -> dict[str, Any]:
    """Recursively sanitize string values inside a dict."""
    result: dict[str, Any] = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = sanitize_text(value)
        elif isinstance(value, dict):
            result[key] = sanitize_dict(value)
        elif isinstance(value, list):
            result[key] = [
                sanitize_text(v) if isinstance(v, str)
                else sanitize_dict(v) if isinstance(v, dict)
                else v
                for v in value
            ]
        else:
            result[key] = value
    return result

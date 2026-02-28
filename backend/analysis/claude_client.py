"""
Claude Sonnet 4.6 client via Amazon Bedrock.
Supports both streaming and non-streaming inference for medical analysis.
"""
from __future__ import annotations

import json
from collections.abc import Generator
from typing import Any
from botocore.exceptions import ClientError

from backend.utils.logger import get_logger
from backend.utils.error_handler import AnalysisError
from config.bedrock_config import (
    get_bedrock_client,
    CLAUDE_MODEL_ID,
    CLAUDE_INFERENCE_PROFILE_ID,
    CLAUDE_FALLBACK_MODEL_IDS,
)

logger = get_logger(__name__)


class ClaudeClient:
    """Wraps Bedrock InvokeModel / InvokeModelWithResponseStream for Claude."""

    def __init__(self) -> None:
        self._client = get_bedrock_client()
        self._active_model_id = CLAUDE_MODEL_ID

    @property
    def active_model_id(self) -> str:
        return self._active_model_id

    @staticmethod
    def _candidate_model_ids() -> list[str]:
        expanded: list[str] = []
        primary_candidates = [CLAUDE_INFERENCE_PROFILE_ID, CLAUDE_MODEL_ID, *CLAUDE_FALLBACK_MODEL_IDS]

        for model_id in primary_candidates:
            if not model_id:
                continue
            expanded.append(model_id)
            if model_id.startswith("anthropic."):
                expanded.append(f"us.{model_id}")

        candidates = expanded
        seen: set[str] = set()
        result: list[str] = []
        for model_id in candidates:
            if model_id and model_id not in seen:
                seen.add(model_id)
                result.append(model_id)
        return result

    @staticmethod
    def _error_details(error: Exception) -> tuple[str, str]:
        if not isinstance(error, ClientError):
            return "", ""
        response = error.response if isinstance(error.response, dict) else {}
        code = str(response.get("Error", {}).get("Code", ""))
        message = str(response.get("Error", {}).get("Message", ""))
        return code, message

    @staticmethod
    def _is_invalid_model_error(error: Exception) -> bool:
        code, message = ClaudeClient._error_details(error)
        return code == "ValidationException" and "model identifier is invalid" in message.lower()

    @staticmethod
    def _is_inference_profile_required_error(error: Exception) -> bool:
        code, message = ClaudeClient._error_details(error)
        lowered = message.lower()
        return code == "ValidationException" and (
            "on-demand throughput isn’t supported" in lowered
            or "on-demand throughput isn't supported" in lowered
            or "retry your request with the id or arn of an inference profile" in lowered
        )

    def invoke(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 8192,
        temperature: float = 0.1,
    ) -> str:
        """Non-streaming invocation. Returns the full response text."""
        body = self._build_body(system_prompt, user_message, max_tokens, temperature)
        last_error: Exception | None = None
        for model_id in self._candidate_model_ids():
            try:
                response = self._client.invoke_model(
                    modelId=model_id,
                    body=json.dumps(body),
                    contentType="application/json",
                    accept="application/json",
                )
                result = json.loads(response["body"].read())
                self._active_model_id = model_id
                return result["content"][0]["text"]
            except Exception as e:
                last_error = e
                if self._is_invalid_model_error(e) or self._is_inference_profile_required_error(e):
                    logger.warning("claude_model_candidate_rejected", model_id=model_id, error=str(e))
                    continue
                raise AnalysisError(f"Claude invocation failed: {e}") from e

        raise AnalysisError(
            "Claude invocation failed: no valid Bedrock model ID found. "
            "Set BEDROCK_CLAUDE_INFERENCE_PROFILE_ID to a Bedrock inference profile ID/ARN available in your region."
        ) from last_error

    def stream(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 8192,
        temperature: float = 0.1,
    ) -> Generator[str, None, None]:
        """Streaming invocation. Yields text chunks as they arrive."""
        body = self._build_body(system_prompt, user_message, max_tokens, temperature)
        last_error: Exception | None = None
        for model_id in self._candidate_model_ids():
            try:
                response = self._client.invoke_model_with_response_stream(
                    modelId=model_id,
                    body=json.dumps(body),
                    contentType="application/json",
                    accept="application/json",
                )
                self._active_model_id = model_id
                for event in response["body"]:
                    chunk = event.get("chunk", {})
                    if not chunk:
                        continue
                    data = json.loads(chunk["bytes"])
                    event_type = data.get("type")
                    if event_type == "content_block_delta":
                        delta = data.get("delta", {})
                        if delta.get("type") == "text_delta":
                            yield delta["text"]
                    elif event_type == "message_stop":
                        break
                return
            except Exception as e:
                last_error = e
                if self._is_invalid_model_error(e) or self._is_inference_profile_required_error(e):
                    logger.warning("claude_model_candidate_rejected", model_id=model_id, error=str(e))
                    continue
                raise AnalysisError(f"Claude streaming failed: {e}") from e

        raise AnalysisError(
            "Claude streaming failed: no valid Bedrock model ID found. "
            "Set BEDROCK_CLAUDE_INFERENCE_PROFILE_ID to a Bedrock inference profile ID/ARN available in your region."
        ) from last_error

    @staticmethod
    def _build_body(
        system_prompt: str,
        user_message: str,
        max_tokens: int,
        temperature: float,
    ) -> dict[str, Any]:
        return {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_message}],
        }

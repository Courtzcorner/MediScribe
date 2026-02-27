"""
Claude Sonnet 4.6 client via Amazon Bedrock.
Supports both streaming and non-streaming inference for medical analysis.
"""
from __future__ import annotations

import json
from collections.abc import Generator
from typing import Any

from backend.utils.logger import get_logger
from backend.utils.error_handler import AnalysisError
from config.bedrock_config import get_bedrock_client, CLAUDE_MODEL_ID, CLAUDE_STRUCTURED_CONFIG

logger = get_logger(__name__)


class ClaudeClient:
    """Wraps Bedrock InvokeModel / InvokeModelWithResponseStream for Claude."""

    def __init__(self) -> None:
        self._client = get_bedrock_client()

    def invoke(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 8192,
        temperature: float = 0.1,
    ) -> str:
        """Non-streaming invocation. Returns the full response text."""
        body = self._build_body(system_prompt, user_message, max_tokens, temperature)
        try:
            response = self._client.invoke_model(
                modelId=CLAUDE_MODEL_ID,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json",
            )
            result = json.loads(response["body"].read())
            return result["content"][0]["text"]
        except Exception as e:
            raise AnalysisError(f"Claude invocation failed: {e}") from e

    def stream(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 8192,
        temperature: float = 0.1,
    ) -> Generator[str, None, None]:
        """Streaming invocation. Yields text chunks as they arrive."""
        body = self._build_body(system_prompt, user_message, max_tokens, temperature)
        try:
            response = self._client.invoke_model_with_response_stream(
                modelId=CLAUDE_MODEL_ID,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json",
            )
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
        except Exception as e:
            raise AnalysisError(f"Claude streaming failed: {e}") from e

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

import asyncio
from typing import Any

import httpx
from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from application.exceptions import (
    LLMAuthenticationError,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponseError,
)
from application.interfaces.services.structured_generation_service import (
    AIResult,
    OutputT,
    StructuredGenerationService,
)


class GeminiStructuredService(StructuredGenerationService):
    def __init__(
        self,
        api_key: str,
        model: str,
        *,
        max_output_tokens: int = 4000,
        timeout_seconds: float = 60.0,
        client: Any | None = None,
    ):
        normalized_api_key = api_key.strip()
        normalized_model = model.strip()

        if not normalized_api_key:
            raise ValueError("Gemini API key is required")
        if not normalized_model:
            raise ValueError("Gemini model is required")
        if max_output_tokens <= 0:
            raise ValueError("Maximum output tokens must be positive")
        if timeout_seconds <= 0:
            raise ValueError("Timeout must be positive")

        self._model = normalized_model
        self._max_output_tokens = max_output_tokens
        self._client = client or genai.Client(
            api_key=normalized_api_key,
            http_options=types.HttpOptions(
                timeout=int(timeout_seconds * 1000),
            ),
        )

    async def generate(
        self,
        *,
        instructions: str,
        input_text: str,
        output_type: type[OutputT],
    ) -> AIResult[OutputT]:
        try:
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=input_text,
                config=types.GenerateContentConfig(
                    system_instruction=instructions,
                    response_mime_type="application/json",
                    response_json_schema=output_type.model_json_schema(),
                    max_output_tokens=self._max_output_tokens,
                ),
            )
        except errors.APIError as exc:
            exc_str = str(exc).lower()
            if (
                exc.code in (401, 403)
                or "api_key_invalid" in exc_str
                or "api key not valid" in exc_str
                or "invalid api key" in exc_str
            ):
                raise LLMAuthenticationError(
                    "The Gemini API key is invalid or unauthorized"
                ) from exc
            if exc.code == 429:
                raise LLMRateLimitError("Gemini rate limit exceeded") from exc
            error_detail = getattr(exc, "message", None) or str(exc)
            raise LLMProviderError(
                f"Gemini request failed with status {exc.code}: {error_detail}"
            ) from exc
        except (asyncio.TimeoutError, httpx.TimeoutException) as exc:
            raise LLMProviderError("Gemini request timed out") from exc
        except httpx.RequestError as exc:
            raise LLMProviderError("Unable to connect to Gemini") from exc

        output = self._parse_output(response, output_type)
        usage = response.usage_metadata
        return AIResult(
            output=output,
            model=response.model_version or self._model,
            input_tokens=(usage.prompt_token_count or 0) if usage else 0,
            output_tokens=(usage.candidates_token_count or 0) if usage else 0,
            provider_request_id=response.response_id,
        )

    @staticmethod
    def _parse_output(
        response: Any,
        output_type: type[OutputT],
    ) -> OutputT:
        try:
            if isinstance(response.parsed, output_type):
                return response.parsed
            if response.parsed is not None:
                return output_type.model_validate(response.parsed)
            if response.text:
                return output_type.model_validate_json(response.text)
        except (ValidationError, ValueError, TypeError) as exc:
            raise LLMResponseError(
                "Gemini returned invalid structured output"
            ) from exc

        raise LLMResponseError(
            "Gemini did not return the required structured output"
        )

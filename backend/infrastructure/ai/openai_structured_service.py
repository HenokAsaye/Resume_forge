from typing import TypeVar

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncOpenAI,
    OpenAIError,
    RateLimitError,
)
from openai import AuthenticationError as OpenAIAuthenticationError
from pydantic import BaseModel

from application.exceptions import (
    LLMAuthenticationError,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponseError,
)
from application.interfaces.services.career_ai_services import AIResult

OutputT = TypeVar("OutputT", bound=BaseModel)


class OpenAIStructuredService:
    def __init__(
        self,
        api_key: str,
        model: str,
        *,
        max_output_tokens: int = 4000,
        timeout_seconds: float = 60.0,
        safety_identifier: str | None = None,
        client: AsyncOpenAI | None = None,
    ):
        normalized_api_key = api_key.strip()
        normalized_model = model.strip()

        if not normalized_api_key:
            raise ValueError("OpenAI API key is required")
        if not normalized_model:
            raise ValueError("OpenAI model is required")
        if max_output_tokens <= 0:
            raise ValueError("Maximum output tokens must be positive")
        if timeout_seconds <= 0:
            raise ValueError("Timeout must be positive")

        self._model = normalized_model
        self._max_output_tokens = max_output_tokens
        self._safety_identifier = safety_identifier
        self._client = client or AsyncOpenAI(
            api_key=normalized_api_key,
            timeout=timeout_seconds,
            max_retries=2,
        )

    async def _generate(
        self,
        *,
        instructions: str,
        input_text: str,
        output_type: type[OutputT],
    ) -> AIResult[OutputT]:
        try:
            response = await self._client.responses.parse(
                model=self._model,
                instructions=instructions,
                input=input_text,
                text_format=output_type,
                max_output_tokens=self._max_output_tokens,
                safety_identifier=self._safety_identifier,
                store=False,
            )
        except OpenAIAuthenticationError as exc:
            raise LLMAuthenticationError(
                "The OpenAI API key is invalid or unauthorized"
            ) from exc
        except RateLimitError as exc:
            raise LLMRateLimitError("OpenAI rate limit exceeded") from exc
        except (APIConnectionError, APITimeoutError) as exc:
            raise LLMProviderError("Unable to connect to OpenAI") from exc
        except APIStatusError as exc:
            raise LLMProviderError(
                f"OpenAI request failed with status {exc.status_code}"
            ) from exc
        except OpenAIError as exc:
            raise LLMProviderError("OpenAI structured generation failed") from exc

        if response.output_parsed is None:
            raise LLMResponseError(
                "OpenAI did not return the required structured output"
            )

        usage = response.usage
        return AIResult(
            output=response.output_parsed,
            model=response.model or self._model,
            input_tokens=usage.input_tokens if usage else 0,
            output_tokens=usage.output_tokens if usage else 0,
            provider_request_id=response.id,
        )

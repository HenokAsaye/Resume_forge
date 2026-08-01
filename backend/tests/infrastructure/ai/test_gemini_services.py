from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from application.dto.resume_schema import ResumeDocument
from application.exceptions import (
    LLMAuthenticationError,
    LLMRateLimitError,
    LLMResponseError,
)
from application.services import StructuredResumeParsingService
from google.genai import errors, types
from infrastructure.ai import GeminiStructuredService


def make_resume() -> ResumeDocument:
    return ResumeDocument.model_validate(
        {
            "contact": {
                "name": "Henok Asaye",
                "email": "henok@example.com",
                "phone": "+251900000000",
                "location": "Addis Ababa",
                "links": [],
            },
            "summary": "Backend engineer.",
            "skills": ["Python", "FastAPI"],
            "experience": [],
            "education": [],
            "projects": [],
            "certifications": [],
        }
    )


def make_client(
    *,
    response: object | None = None,
    error: Exception | None = None,
) -> tuple[object, AsyncMock]:
    generate = AsyncMock(return_value=response, side_effect=error)
    client = SimpleNamespace(
        aio=SimpleNamespace(
            models=SimpleNamespace(generate_content=generate),
        )
    )
    return client, generate


@pytest.mark.asyncio
async def test_parse_returns_gemini_structured_output_and_usage() -> None:
    resume = make_resume()
    response = SimpleNamespace(
        parsed=resume,
        text=None,
        model_version="gemini-test-model-001",
        response_id="response-123",
        usage_metadata=SimpleNamespace(
            prompt_token_count=180,
            candidates_token_count=90,
        ),
    )
    client, generate = make_client(response=response)
    generator = GeminiStructuredService(
        api_key="test-key",
        model="gemini-test-model",
        client=client,
    )
    service = StructuredResumeParsingService(generator)

    result = await service.parse("Henok Asaye\nBackend engineer")

    assert result.resume == resume
    assert result.model == "gemini-test-model-001"
    assert result.input_tokens == 180
    assert result.output_tokens == 90
    assert result.provider_request_id == "response-123"

    request = generate.await_args.kwargs
    assert request["model"] == "gemini-test-model"
    assert "Henok Asaye" in request["contents"]
    assert isinstance(request["config"], types.GenerateContentConfig)
    assert request["config"].response_json_schema == (
        ResumeDocument.model_json_schema()
    )
    assert request["config"].response_mime_type == "application/json"


@pytest.mark.asyncio
async def test_parse_validates_json_when_sdk_does_not_parse_response() -> None:
    resume = make_resume()
    response = SimpleNamespace(
        parsed=None,
        text=resume.model_dump_json(),
        model_version=None,
        response_id=None,
        usage_metadata=None,
    )
    client, _ = make_client(response=response)
    generator = GeminiStructuredService(
        api_key="test-key",
        model="gemini-test-model",
        client=client,
    )
    service = StructuredResumeParsingService(generator)

    result = await service.parse("Backend engineer")

    assert result.resume == resume
    assert result.model == "gemini-test-model"
    assert result.input_tokens == 0
    assert result.output_tokens == 0


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("status_code", "expected_error"),
    [
        (401, LLMAuthenticationError),
        (403, LLMAuthenticationError),
        (429, LLMRateLimitError),
    ],
)
async def test_parse_normalizes_gemini_client_errors(
    status_code: int,
    expected_error: type[Exception],
) -> None:
    provider_error = errors.ClientError(
        status_code,
        {"error": {"message": "provider detail"}},
    )
    client, _ = make_client(error=provider_error)
    generator = GeminiStructuredService(
        api_key="test-key",
        model="gemini-test-model",
        client=client,
    )
    service = StructuredResumeParsingService(generator)

    with pytest.raises(expected_error):
        await service.parse("Backend engineer")


@pytest.mark.asyncio
async def test_parse_rejects_invalid_structured_output() -> None:
    response = SimpleNamespace(
        parsed=None,
        text='{"not": "a resume"}',
        model_version="gemini-test-model",
        response_id=None,
        usage_metadata=None,
    )
    client, _ = make_client(response=response)
    generator = GeminiStructuredService(
        api_key="test-key",
        model="gemini-test-model",
        client=client,
    )
    service = StructuredResumeParsingService(generator)

    with pytest.raises(LLMResponseError):
        await service.parse("Backend engineer")

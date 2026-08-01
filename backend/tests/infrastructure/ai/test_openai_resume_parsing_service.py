from types import SimpleNamespace
from typing import cast
from unittest.mock import AsyncMock

import pytest
from application.dto.resume_schema import ResumeDocument
from application.exceptions import (
    EmptyResumeTextError,
    LLMResponseError,
)
from application.services import StructuredResumeParsingService
from infrastructure.ai import OpenAIStructuredService
from openai import AsyncOpenAI


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
            "experience": [
                {
                    "title": "Backend Engineer",
                    "company": "Acme",
                    "start": "2022",
                    "end": "Present",
                    "bullets": ["Built REST APIs."],
                }
            ],
            "education": [],
            "projects": [],
            "certifications": [],
        }
    )


def make_client(response: object) -> tuple[AsyncOpenAI, AsyncMock]:
    parse = AsyncMock(return_value=response)
    fake_client = SimpleNamespace(responses=SimpleNamespace(parse=parse))
    return cast(AsyncOpenAI, fake_client), parse


@pytest.mark.asyncio
async def test_parse_returns_structured_resume_and_usage() -> None:
    parsed_resume = make_resume()
    response = SimpleNamespace(
        output_parsed=parsed_resume,
        model="configured-model",
        id="resp_123",
        usage=SimpleNamespace(
            input_tokens=250,
            output_tokens=120,
        ),
    )
    client, parse_mock = make_client(response)

    generator = OpenAIStructuredService(
        api_key="test-key",
        model="configured-model",
        client=client,
    )
    service = StructuredResumeParsingService(generator)

    result = await service.parse("Henok Asaye\nBackend Engineer")

    assert result.resume == parsed_resume
    assert result.model == "configured-model"
    assert result.input_tokens == 250
    assert result.output_tokens == 120
    assert result.provider_request_id == "resp_123"

    parse_mock.assert_awaited_once()
    request = parse_mock.await_args.kwargs

    assert request["text_format"] is ResumeDocument
    assert request["store"] is False
    assert "Henok Asaye" in request["input"]


@pytest.mark.asyncio
async def test_parse_rejects_empty_text() -> None:
    response = SimpleNamespace()
    client, parse_mock = make_client(response)

    generator = OpenAIStructuredService(
        api_key="test-key",
        model="configured-model",
        client=client,
    )
    service = StructuredResumeParsingService(generator)

    with pytest.raises(EmptyResumeTextError):
        await service.parse("   ")

    parse_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_parse_rejects_missing_structured_output() -> None:
    response = SimpleNamespace(
        output_parsed=None,
        model="configured-model",
        id="resp_123",
        usage=None,
    )
    client, _ = make_client(response)

    generator = OpenAIStructuredService(
        api_key="test-key",
        model="configured-model",
        client=client,
    )
    service = StructuredResumeParsingService(generator)

    with pytest.raises(LLMResponseError):
        await service.parse("Backend engineer resume")

from types import SimpleNamespace
from typing import cast
from unittest.mock import AsyncMock

import pytest
from application.dto.career_ai_schema import (
    ATSAnalysis,
    CoverLetterDocument,
    JobDocument,
    ResumeChange,
    ResumeOptimization,
)
from application.dto.resume_schema import ResumeDocument
from application.exceptions import EmptyJobTextError
from application.services import (
    StructuredATSAnalysisService,
    StructuredCoverLetterGenerationService,
    StructuredJobParsingService,
    StructuredResumeOptimizationService,
)
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


def make_job() -> JobDocument:
    return JobDocument(
        title="Senior Backend Engineer",
        company="Acme",
        seniority="senior",
        responsibilities=["Design APIs"],
        required_skills=["Python", "FastAPI"],
        preferred_skills=["Kubernetes"],
        qualifications=["Five years of experience"],
        keywords=["REST", "microservices"],
    )


def make_analysis() -> ATSAnalysis:
    return ATSAnalysis(
        match_score=75,
        missing_keywords=["Kubernetes"],
        suggestions=["Clarify API impact"],
        strengths=["Python and FastAPI"],
        weaknesses=["Kubernetes is not listed"],
    )


def make_client(output: object) -> tuple[AsyncOpenAI, AsyncMock]:
    response = SimpleNamespace(
        output_parsed=output,
        model="configured-model",
        id="resp_123",
        usage=SimpleNamespace(
            input_tokens=200,
            output_tokens=100,
        ),
    )
    parse = AsyncMock(return_value=response)
    client = SimpleNamespace(responses=SimpleNamespace(parse=parse))
    return cast(AsyncOpenAI, client), parse


@pytest.mark.asyncio
async def test_job_parser_uses_job_schema() -> None:
    client, parse_mock = make_client(make_job())
    generator = OpenAIStructuredService(
        api_key="test-key",
        model="configured-model",
        client=client,
    )
    service = StructuredJobParsingService(generator)

    result = await service.parse("We need a Python backend engineer")

    assert result.output.title == "Senior Backend Engineer"
    assert parse_mock.await_args.kwargs["text_format"] is JobDocument


@pytest.mark.asyncio
async def test_job_parser_rejects_empty_text() -> None:
    client, parse_mock = make_client(make_job())
    generator = OpenAIStructuredService(
        api_key="test-key",
        model="configured-model",
        client=client,
    )
    service = StructuredJobParsingService(generator)

    with pytest.raises(EmptyJobTextError):
        await service.parse(" ")

    parse_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_ats_service_returns_score() -> None:
    client, parse_mock = make_client(make_analysis())
    generator = OpenAIStructuredService(
        api_key="test-key",
        model="configured-model",
        client=client,
    )
    service = StructuredATSAnalysisService(generator)

    result = await service.analyze(make_resume(), make_job())

    assert result.output.match_score == 75
    assert parse_mock.await_args.kwargs["text_format"] is ATSAnalysis
    assert '"resume":' in parse_mock.await_args.kwargs["input"]


@pytest.mark.asyncio
async def test_optimizer_returns_complete_resume_and_changes() -> None:
    optimization = ResumeOptimization(
        optimized_resume=make_resume(),
        changes=[
            ResumeChange(
                section="summary",
                operation="modified",
                before="Backend engineer.",
                after="Backend engineer specializing in APIs.",
                reason="Improve relevance to the role",
            )
        ],
    )
    client, parse_mock = make_client(optimization)
    generator = OpenAIStructuredService(
        api_key="test-key",
        model="configured-model",
        client=client,
    )
    service = StructuredResumeOptimizationService(generator)

    result = await service.optimize(
        make_resume(),
        make_job(),
        make_analysis(),
    )

    assert result.output.changes[0].section == "summary"
    assert parse_mock.await_args.kwargs["text_format"] is ResumeOptimization
    assert '"initial_ats_analysis":' in parse_mock.await_args.kwargs["input"]


@pytest.mark.asyncio
async def test_cover_letter_service_returns_editable_content() -> None:
    cover_letter = CoverLetterDocument(
        content="Dear Hiring Manager,\n\nI am applying for the role.",
        highlights_used=["Python", "FastAPI"],
    )
    client, parse_mock = make_client(cover_letter)
    generator = OpenAIStructuredService(
        api_key="test-key",
        model="configured-model",
        client=client,
    )
    service = StructuredCoverLetterGenerationService(generator)

    result = await service.generate(make_resume(), make_job())

    assert result.output.content.startswith("Dear Hiring Manager")
    assert parse_mock.await_args.kwargs["text_format"] is CoverLetterDocument
    assert parse_mock.await_args.kwargs["store"] is False

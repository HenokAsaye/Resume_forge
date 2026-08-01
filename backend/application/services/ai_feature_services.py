import json

from application.dto.career_ai_schema import (
    ATSAnalysis,
    CoverLetterDocument,
    JobDocument,
    ResumeOptimization,
)
from application.dto.resume_schema import ResumeDocument
from application.exceptions import EmptyJobTextError, EmptyResumeTextError
from application.interfaces.services.career_ai_services import (
    AIResult,
    ATSAnalysisService,
    CoverLetterGenerationService,
    JobParsingService,
    ResumeOptimizationService,
)
from application.interfaces.services.resume_parsing_service import (
    ResumeParsingResult,
    ResumeParsingService,
)
from application.interfaces.services.structured_generation_service import (
    StructuredGenerationService,
)
from application.services.prompts import get_prompt


def serialize_input(data: dict[str, object]) -> str:
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


class StructuredResumeParsingService(ResumeParsingService):
    def __init__(self, generator: StructuredGenerationService):
        self._generator = generator

    async def parse(self, text: str) -> ResumeParsingResult:
        normalized_text = text.strip()
        if not normalized_text:
            raise EmptyResumeTextError("Extracted resume text cannot be empty")

        prompt = get_prompt("resume_parsing")
        result = await self._generator.generate(
            instructions=prompt.instructions,
            input_text=prompt.render(resume_text=normalized_text),
            output_type=ResumeDocument,
        )
        return ResumeParsingResult(
            resume=result.output,
            model=result.model,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
            provider_request_id=result.provider_request_id,
        )


class StructuredJobParsingService(JobParsingService):
    def __init__(self, generator: StructuredGenerationService):
        self._generator = generator

    async def parse(self, text: str) -> AIResult[JobDocument]:
        normalized_text = text.strip()
        if not normalized_text:
            raise EmptyJobTextError("Job-description text cannot be empty")

        prompt = get_prompt("job_parsing")
        return await self._generator.generate(
            instructions=prompt.instructions,
            input_text=prompt.render(job_text=normalized_text),
            output_type=JobDocument,
        )


class StructuredATSAnalysisService(ATSAnalysisService):
    def __init__(self, generator: StructuredGenerationService):
        self._generator = generator

    async def analyze(
        self,
        resume: ResumeDocument,
        job: JobDocument,
    ) -> AIResult[ATSAnalysis]:
        prompt = get_prompt("ats_analysis")
        input_json = serialize_input(
            {
                "resume": resume.model_dump(mode="json"),
                "job": job.model_dump(mode="json"),
            }
        )
        return await self._generator.generate(
            instructions=prompt.instructions,
            input_text=prompt.render(input_json=input_json),
            output_type=ATSAnalysis,
        )


class StructuredResumeOptimizationService(ResumeOptimizationService):
    def __init__(self, generator: StructuredGenerationService):
        self._generator = generator

    async def optimize(
        self,
        resume: ResumeDocument,
        job: JobDocument,
        analysis: ATSAnalysis,
    ) -> AIResult[ResumeOptimization]:
        prompt = get_prompt("resume_optimization")
        input_json = serialize_input(
            {
                "original_resume": resume.model_dump(mode="json"),
                "job": job.model_dump(mode="json"),
                "initial_ats_analysis": analysis.model_dump(mode="json"),
            }
        )
        return await self._generator.generate(
            instructions=prompt.instructions,
            input_text=prompt.render(input_json=input_json),
            output_type=ResumeOptimization,
        )


class StructuredCoverLetterGenerationService(CoverLetterGenerationService):
    def __init__(self, generator: StructuredGenerationService):
        self._generator = generator

    async def generate(
        self,
        resume: ResumeDocument,
        job: JobDocument,
    ) -> AIResult[CoverLetterDocument]:
        prompt = get_prompt("cover_letter")
        input_json = serialize_input(
            {
                "resume": resume.model_dump(mode="json"),
                "job": job.model_dump(mode="json"),
            }
        )
        return await self._generator.generate(
            instructions=prompt.instructions,
            input_text=prompt.render(input_json=input_json),
            output_type=CoverLetterDocument,
        )

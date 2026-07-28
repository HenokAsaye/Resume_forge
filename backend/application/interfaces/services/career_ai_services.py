from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Generic, TypeVar

from application.dto.career_ai_schema import (
    ATSAnalysis,
    CoverLetterDocument,
    JobDocument,
    ResumeOptimization,
)
from application.dto.resume_schema import ResumeDocument

OutputT = TypeVar("OutputT")


@dataclass(frozen=True, slots=True)
class AIResult(Generic[OutputT]):
    output: OutputT
    model: str
    input_tokens: int
    output_tokens: int
    provider_request_id: str | None = None

    def __post_init__(self) -> None:
        if not self.model.strip():
            raise ValueError("Model name is required")
        if self.input_tokens < 0:
            raise ValueError("Input token count cannot be negative")
        if self.output_tokens < 0:
            raise ValueError("Output token count cannot be negative")


class JobParsingService(ABC):
    @abstractmethod
    async def parse(self, text: str) -> AIResult[JobDocument]:
        """Convert job-description text into structured data."""


class ATSAnalysisService(ABC):
    @abstractmethod
    async def analyze(
        self,
        resume: ResumeDocument,
        job: JobDocument,
    ) -> AIResult[ATSAnalysis]:
        """Score a resume against a job description."""


class ResumeOptimizationService(ABC):
    @abstractmethod
    async def optimize(
        self,
        resume: ResumeDocument,
        job: JobDocument,
        analysis: ATSAnalysis,
    ) -> AIResult[ResumeOptimization]:
        """Tailor a resume using an ATS analysis without inventing facts."""


class CoverLetterGenerationService(ABC):
    @abstractmethod
    async def generate(
        self,
        resume: ResumeDocument,
        job: JobDocument,
    ) -> AIResult[CoverLetterDocument]:
        """Generate a job-specific cover letter using supported resume facts."""

from abc import ABC, abstractmethod

from application.dto.career_ai_schema import (
    ATSAnalysis,
    CoverLetterDocument,
    JobDocument,
    ResumeOptimization,
)
from application.dto.resume_schema import ResumeDocument
from application.interfaces.services.structured_generation_service import AIResult


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

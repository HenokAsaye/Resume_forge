import uuid

from application.dto.career_ai_schema import JobDocument
from application.dto.resume_schema import ResumeDocument
from application.interfaces.services.career_ai_services import (
    CoverLetterGenerationService,
)
from domain.entities.cover_letter import CoverLetter
from domain.exceptions import (
    CoverLetterNotFoundError,
    JobNotFoundError,
    JobNotParsedError,
    ResumeNotFoundError,
    ResumeNotParsedError,
)
from domain.interfaces.repositories.cover_letter_repository import (
    CoverLetterRepository,
)
from domain.interfaces.repositories.job_repository import JobRepository
from domain.interfaces.repositories.resume_repository import ResumeRepository


class CreateCoverLetterUseCase:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        job_repo: JobRepository,
        cover_letter_repo: CoverLetterRepository,
        generation_service: CoverLetterGenerationService,
    ):
        self._resume_repo = resume_repo
        self._job_repo = job_repo
        self._cover_letter_repo = cover_letter_repo
        self._generation_service = generation_service

    async def execute(
        self,
        resume_id: str,
        job_id: str,
        user_id: str,
    ) -> CoverLetter:
        resume = await self._resume_repo.get_by_id(resume_id, user_id)
        if resume is None:
            raise ResumeNotFoundError("Resume not found")
        if resume.parsed_json is None:
            raise ResumeNotParsedError(
                "Resume must be parsed before generating a cover letter"
            )

        job = await self._job_repo.get_by_id(job_id, user_id)
        if job is None:
            raise JobNotFoundError("Job not found")
        if job.parsed_json is None:
            raise JobNotParsedError(
                "Job must be parsed before generating a cover letter"
            )

        versions = await self._resume_repo.list_versions(resume.id, user_id)
        matching_version = next(
            (version for version in versions if version.source_job_id == job.id),
            None,
        )
        resume_data = (
            matching_version.optimized_json
            if matching_version is not None
            else resume.parsed_json
        )
        generated = await self._generation_service.generate(
            ResumeDocument.model_validate(resume_data),
            JobDocument.model_validate(job.parsed_json),
        )
        return await self._cover_letter_repo.create(
            CoverLetter(
                id=str(uuid.uuid4()),
                user_id=user_id,
                resume_id=resume.id,
                job_id=job.id,
                resume_version_id=(
                    matching_version.id if matching_version is not None else None
                ),
                content=generated.output.content,
            )
        )


class ListCoverLettersUseCase:
    def __init__(self, cover_letter_repo: CoverLetterRepository):
        self._cover_letter_repo = cover_letter_repo

    async def execute(
        self,
        user_id: str,
        resume_id: str | None = None,
        job_id: str | None = None,
    ) -> list[CoverLetter]:
        return await self._cover_letter_repo.list_by_user(
            user_id,
            resume_id,
            job_id,
        )


class GetCoverLetterUseCase:
    def __init__(self, cover_letter_repo: CoverLetterRepository):
        self._cover_letter_repo = cover_letter_repo

    async def execute(
        self,
        cover_letter_id: str,
        user_id: str,
    ) -> CoverLetter:
        cover_letter = await self._cover_letter_repo.get_by_id(
            cover_letter_id,
            user_id,
        )
        if cover_letter is None:
            raise CoverLetterNotFoundError("Cover letter not found")
        return cover_letter


class UpdateCoverLetterUseCase:
    def __init__(self, cover_letter_repo: CoverLetterRepository):
        self._cover_letter_repo = cover_letter_repo

    async def execute(
        self,
        cover_letter_id: str,
        user_id: str,
        content: str,
    ) -> CoverLetter:
        cover_letter = await self._cover_letter_repo.get_by_id(
            cover_letter_id,
            user_id,
        )
        if cover_letter is None:
            raise CoverLetterNotFoundError("Cover letter not found")
        cover_letter.edit(content)
        updated = await self._cover_letter_repo.update(cover_letter)
        if updated is None:
            raise CoverLetterNotFoundError("Cover letter not found")
        return updated


class DeleteCoverLetterUseCase:
    def __init__(self, cover_letter_repo: CoverLetterRepository):
        self._cover_letter_repo = cover_letter_repo

    async def execute(self, cover_letter_id: str, user_id: str) -> None:
        if await self._cover_letter_repo.delete(cover_letter_id, user_id) is None:
            raise CoverLetterNotFoundError("Cover letter not found")

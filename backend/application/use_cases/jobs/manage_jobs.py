import uuid

from application.interfaces.services.career_ai_services import JobParsingService
from domain.entities.job_description import JobDescription
from domain.exceptions import JobNotFoundError
from domain.interfaces.repositories.job_repository import JobRepository


class CreateJobUseCase:
    def __init__(self, job_repo: JobRepository):
        self._job_repo = job_repo

    async def execute(
        self,
        *,
        user_id: str,
        title: str,
        company: str,
        raw_text: str,
        url: str | None,
    ) -> JobDescription:
        return await self._job_repo.create(
            JobDescription(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title=title,
                company=company,
                raw_text=raw_text,
                url=url,
            )
        )


class ListJobsUseCase:
    def __init__(self, job_repo: JobRepository):
        self._job_repo = job_repo

    async def execute(self, user_id: str) -> list[JobDescription]:
        return await self._job_repo.list_by_user(user_id)


class GetJobUseCase:
    def __init__(self, job_repo: JobRepository):
        self._job_repo = job_repo

    async def execute(self, job_id: str, user_id: str) -> JobDescription:
        job = await self._job_repo.get_by_id(job_id, user_id)
        if job is None:
            raise JobNotFoundError("Job not found")
        return job


class DeleteJobUseCase:
    def __init__(self, job_repo: JobRepository):
        self._job_repo = job_repo

    async def execute(self, job_id: str, user_id: str) -> None:
        if await self._job_repo.delete(job_id, user_id) is None:
            raise JobNotFoundError("Job not found")


class ParseJobUseCase:
    def __init__(
        self,
        job_repo: JobRepository,
        parser: JobParsingService,
    ):
        self._job_repo = job_repo
        self._parser = parser

    async def execute(self, job_id: str, user_id: str) -> JobDescription:
        job = await self._job_repo.get_by_id(job_id, user_id)
        if job is None:
            raise JobNotFoundError("Job not found")
        if job.parsed_json is not None:
            return job

        parsed = await self._parser.parse(job.raw_text)
        job.mark_parsed(parsed.output.model_dump(mode="json"))
        updated = await self._job_repo.update(job)
        if updated is None:
            raise JobNotFoundError("Job not found")
        return updated

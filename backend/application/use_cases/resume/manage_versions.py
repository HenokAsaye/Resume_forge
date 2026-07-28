from domain.entities.resume import ResumeVersion
from domain.exceptions import ResumeNotFoundError, ResumeVersionNotFoundError
from domain.interfaces.repositories.resume_repository import ResumeRepository


class ListResumeVersionsUseCase:
    def __init__(self, resume_repo: ResumeRepository):
        self._resume_repo = resume_repo

    async def execute(self, resume_id: str, user_id: str) -> list[ResumeVersion]:
        if await self._resume_repo.get_by_id(resume_id, user_id) is None:
            raise ResumeNotFoundError("Resume not found")
        return await self._resume_repo.list_versions(resume_id, user_id)


class GetResumeVersionUseCase:
    def __init__(self, resume_repo: ResumeRepository):
        self._resume_repo = resume_repo

    async def execute(
        self,
        resume_id: str,
        version_id: str,
        user_id: str,
    ) -> ResumeVersion:
        version = await self._resume_repo.get_version(
            resume_id,
            version_id,
            user_id,
        )
        if version is None:
            raise ResumeVersionNotFoundError("Resume version not found")
        return version

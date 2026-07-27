from domain.entities.resume import Resume
from domain.exceptions import ResumeNotFoundError
from domain.interfaces.repositories.resume_repository import ResumeRepository


class GetResumeUseCase:
    def __init__(self, resume_repo: ResumeRepository):
        self._resume_repo = resume_repo

    async def execute(self, resume_id: str, user_id: str) -> Resume:
        resume = await self._resume_repo.get_by_id(resume_id, user_id)
        if resume is None:
            raise ResumeNotFoundError("Resume not found")
        return resume

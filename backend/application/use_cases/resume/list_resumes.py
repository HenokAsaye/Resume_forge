from domain.entities.resume import Resume
from domain.interfaces.repositories.resume_repository import ResumeRepository


class ListResumesUseCase:
    def __init__(self, resume_repo: ResumeRepository):
        self._resume_repo = resume_repo

    async def execute(self, user_id: str) -> list[Resume]:
        return await self._resume_repo.list_by_user(user_id)

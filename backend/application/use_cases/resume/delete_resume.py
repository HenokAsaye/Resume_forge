from application.exceptions import StoredFileNotFoundError
from application.interfaces.services.file_storage_service import FileStorageService
from domain.exceptions import ResumeNotFoundError
from domain.interfaces.repositories.resume_repository import ResumeRepository


class DeleteResumeUseCase:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        storage: FileStorageService,
    ):
        self._resume_repo = resume_repo
        self._storage = storage

    async def execute(self, resume_id: str, user_id: str) -> None:
        resume = await self._resume_repo.get_by_id(resume_id, user_id)
        if resume is None:
            raise ResumeNotFoundError("Resume not found")

        try:
            await self._storage.delete(
                resume.storage_bucket,
                resume.storage_path,
            )
        except StoredFileNotFoundError:
            pass

        deleted = await self._resume_repo.delete(resume_id, user_id)
        if deleted is None:
            raise ResumeNotFoundError("Resume not found")

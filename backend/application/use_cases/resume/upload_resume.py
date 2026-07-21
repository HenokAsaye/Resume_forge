import uuid
from datetime import datetime

from domain.entities.resume import Resume
from domain.interfaces.repositories.resume_repository import ResumeRepository
from domain.interfaces.services.file_storage_service import FileStorageService


class UploadResumeUseCase:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        storage: FileStorageService,
    ):
        self._resume_repo = resume_repo
        self._storage = storage

    async def execute(
        self, user_id: str, file_name: str, file_content: bytes
    ) -> Resume:
        file_path = f"users/{user_id}/resumes/{uuid.uuid4()}_{file_name}"
        file_url = await self._storage.upload("resumes", file_path, file_content)

        resume = Resume(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=file_name,
            original_file_url=file_url,
            created_at=datetime.utcnow(),
        )
        return await self._resume_repo.create(resume)

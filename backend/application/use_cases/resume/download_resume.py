from dataclasses import dataclass

from application.interfaces.services.file_storage_service import FileStorageService
from domain.entities.resume import ResumeMimeType
from domain.exceptions import ResumeNotFoundError
from domain.interfaces.repositories.resume_repository import ResumeRepository


@dataclass(frozen=True, slots=True)
class ResumeDownload:
    filename: str
    content_type: ResumeMimeType
    content: bytes


class DownloadResumeUseCase:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        storage: FileStorageService,
    ):
        self._resume_repo = resume_repo
        self._storage = storage

    async def execute(self, resume_id: str, user_id: str) -> ResumeDownload:
        resume = await self._resume_repo.get_by_id(resume_id, user_id)
        if resume is None:
            raise ResumeNotFoundError("Resume not found")

        content = await self._storage.download(
            resume.storage_bucket,
            resume.storage_path,
        )
        return ResumeDownload(
            filename=resume.original_filename,
            content_type=resume.mime_type,
            content=content,
        )

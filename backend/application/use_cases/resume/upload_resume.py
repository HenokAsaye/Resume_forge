import uuid

from application.exceptions import FileStorageError
from application.interfaces.services.file_storage_service import FileStorageService
from application.interfaces.services.file_validation_service import (
    FileValidationService,
)
from domain.entities.resume import Resume
from domain.interfaces.repositories.resume_repository import ResumeRepository


class UploadResumeUseCase:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        storage: FileStorageService,
        validator: FileValidationService,
        storage_bucket: str,
    ):
        self._resume_repo = resume_repo
        self._storage = storage
        self._validator = validator
        self._storage_bucket = storage_bucket

    async def execute(
        self,
        user_id: str,
        name: str,
        filename: str,
        declared_content_type: str | None,
        content: bytes,
    ) -> Resume:
        validated = await self._validator.validate(
            filename=filename,
            declared_content_type=declared_content_type,
            content=content,
        )

        resume_id = str(uuid.uuid4())
        storage_path = f"{user_id}/{resume_id}/source{validated.extension}"
        stored_file = await self._storage.upload(
            bucket=self._storage_bucket,
            path=storage_path,
            content=validated.content,
            content_type=validated.mime_type,
        )

        resume = Resume(
            id=resume_id,
            user_id=user_id,
            name=name,
            storage_bucket=stored_file.bucket,
            storage_path=stored_file.path,
            original_filename=validated.original_filename,
            mime_type=validated.mime_type,
            size_bytes=validated.size_bytes,
            sha256=validated.sha256,
        )

        try:
            return await self._resume_repo.create(resume)
        except Exception as persistence_error:
            try:
                await self._storage.delete(
                    stored_file.bucket,
                    stored_file.path,
                )
            except FileStorageError as cleanup_error:
                persistence_error.add_note(
                    f"Storage cleanup also failed: {cleanup_error}"
                )
            raise

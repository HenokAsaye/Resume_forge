from unittest.mock import AsyncMock

import pytest

from application.interfaces.services.file_storage_service import StoredFile
from application.interfaces.services.file_validation_service import ValidatedFile
from application.use_cases.resume.upload_resume import UploadResumeUseCase
from domain.entities.resume import ResumeMimeType, ResumeStatus


def validated_pdf() -> ValidatedFile:
    return ValidatedFile(
        original_filename="backend-resume.pdf",
        extension=".pdf",
        mime_type=ResumeMimeType.PDF,
        size_bytes=11,
        sha256="a" * 64,
        content=b"pdf-content",
    )


@pytest.mark.asyncio
async def test_upload_resume_orchestrates_validation_storage_and_repository() -> None:
    validator = AsyncMock()
    validator.validate.return_value = validated_pdf()

    storage = AsyncMock()
    storage.upload.return_value = StoredFile(
        bucket="resumes",
        path="user-id/resume-id/source.pdf",
        content_type=ResumeMimeType.PDF,
        size_bytes=11,
    )

    repository = AsyncMock()
    repository.create.side_effect = lambda resume: resume

    use_case = UploadResumeUseCase(
        resume_repo=repository,
        storage=storage,
        validator=validator,
        storage_bucket="resumes",
    )

    resume = await use_case.execute(
        user_id="user-id",
        name="Backend Resume",
        filename="backend-resume.pdf",
        declared_content_type="application/pdf",
        content=b"pdf-content",
    )

    assert resume.user_id == "user-id"
    assert resume.name == "Backend Resume"
    assert resume.original_filename == "backend-resume.pdf"
    assert resume.mime_type is ResumeMimeType.PDF
    assert resume.status is ResumeStatus.UPLOADED
    assert resume.storage_path.endswith("/source.pdf")
    repository.create.assert_awaited_once_with(resume)


@pytest.mark.asyncio
async def test_repository_failure_deletes_uploaded_object() -> None:
    validator = AsyncMock()
    validator.validate.return_value = validated_pdf()

    storage = AsyncMock()
    storage.upload.return_value = StoredFile(
        bucket="resumes",
        path="user-id/resume-id/source.pdf",
        content_type=ResumeMimeType.PDF,
        size_bytes=11,
    )

    repository = AsyncMock()
    repository.create.side_effect = RuntimeError("database unavailable")

    use_case = UploadResumeUseCase(
        resume_repo=repository,
        storage=storage,
        validator=validator,
        storage_bucket="resumes",
    )

    with pytest.raises(RuntimeError, match="database unavailable"):
        await use_case.execute(
            user_id="user-id",
            name="Backend Resume",
            filename="backend-resume.pdf",
            declared_content_type="application/pdf",
            content=b"pdf-content",
        )

    storage.delete.assert_awaited_once_with(
        "resumes",
        "user-id/resume-id/source.pdf",
    )

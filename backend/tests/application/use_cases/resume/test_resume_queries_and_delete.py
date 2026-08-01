from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from application.exceptions import StoredFileNotFoundError
from application.use_cases.resume import (
    DeleteResumeUseCase,
    DownloadResumeUseCase,
    GetResumeUseCase,
    ListResumesUseCase,
)
from domain.entities.resume import Resume, ResumeMimeType
from domain.exceptions import ResumeNotFoundError


def make_resume() -> Resume:
    created_at = datetime(2026, 7, 25, 10, 0, tzinfo=UTC)
    return Resume(
        id="10000000-0000-0000-0000-000000000001",
        user_id="20000000-0000-0000-0000-000000000001",
        name="Backend Resume",
        storage_path=(
            "20000000-0000-0000-0000-000000000001/"
            "10000000-0000-0000-0000-000000000001/source.pdf"
        ),
        original_filename="backend-resume.pdf",
        mime_type=ResumeMimeType.PDF,
        size_bytes=1024,
        sha256="a" * 64,
        created_at=created_at,
        updated_at=created_at,
    )


@pytest.mark.asyncio
async def test_get_resume_rejects_unowned_or_missing_resume() -> None:
    repository = AsyncMock()
    repository.get_by_id.return_value = None
    use_case = GetResumeUseCase(repository)

    with pytest.raises(ResumeNotFoundError):
        await use_case.execute("resume-id", "user-id")

    repository.get_by_id.assert_awaited_once_with("resume-id", "user-id")


@pytest.mark.asyncio
async def test_list_resumes_uses_authenticated_user_id() -> None:
    resume = make_resume()
    repository = AsyncMock()
    repository.list_by_user.return_value = [resume]
    use_case = ListResumesUseCase(repository)

    result = await use_case.execute(resume.user_id)

    assert result == [resume]
    repository.list_by_user.assert_awaited_once_with(resume.user_id)


@pytest.mark.asyncio
async def test_download_returns_original_filename_type_and_content() -> None:
    resume = make_resume()
    repository = AsyncMock()
    repository.get_by_id.return_value = resume
    storage = AsyncMock()
    storage.download.return_value = b"pdf-content"
    use_case = DownloadResumeUseCase(repository, storage)

    downloaded = await use_case.execute(resume.id, resume.user_id)

    assert downloaded.filename == "backend-resume.pdf"
    assert downloaded.content_type is ResumeMimeType.PDF
    assert downloaded.content == b"pdf-content"
    storage.download.assert_awaited_once_with(
        resume.storage_bucket,
        resume.storage_path,
    )


@pytest.mark.asyncio
async def test_delete_removes_file_before_database_record() -> None:
    resume = make_resume()
    calls: list[str] = []

    repository = AsyncMock()
    repository.get_by_id.return_value = resume

    async def delete_record(*args: object) -> Resume:
        calls.append("database")
        return resume

    repository.delete.side_effect = delete_record
    storage = AsyncMock()

    async def delete_file(*args: object) -> None:
        calls.append("storage")

    storage.delete.side_effect = delete_file
    use_case = DeleteResumeUseCase(repository, storage)

    await use_case.execute(resume.id, resume.user_id)

    assert calls == ["storage", "database"]


@pytest.mark.asyncio
async def test_delete_continues_when_storage_object_is_already_missing() -> None:
    resume = make_resume()
    repository = AsyncMock()
    repository.get_by_id.return_value = resume
    repository.delete.return_value = resume
    storage = AsyncMock()
    storage.delete.side_effect = StoredFileNotFoundError("Resume file not found")
    use_case = DeleteResumeUseCase(repository, storage)

    await use_case.execute(resume.id, resume.user_id)

    repository.delete.assert_awaited_once_with(resume.id, resume.user_id)

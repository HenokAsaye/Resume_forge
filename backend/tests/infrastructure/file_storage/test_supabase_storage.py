from typing import Any

import pytest
from application.exceptions import FileStorageError, StoredFileNotFoundError
from domain.entities.resume import ResumeMimeType
from infrastructure.file_storage.supabase_storage import SupabaseStorageService
from storage3.exceptions import StorageApiError


class FakeBucket:
    def __init__(self) -> None:
        self.upload_call: tuple[str, bytes, dict[str, str]] | None = None
        self.download_call: str | None = None
        self.remove_call: list[str] | None = None
        self.downloaded_content = b"resume-content"
        self.error: Exception | None = None

    async def upload(
        self,
        path: str,
        content: bytes,
        options: dict[str, str],
    ) -> object:
        if self.error:
            raise self.error
        self.upload_call = (path, content, options)
        return object()

    async def download(self, path: str) -> bytes:
        if self.error:
            raise self.error
        self.download_call = path
        return self.downloaded_content

    async def remove(self, paths: list[str]) -> list[dict[str, Any]]:
        if self.error:
            raise self.error
        self.remove_call = paths
        return [{"name": path} for path in paths]


class FakeStorage:
    def __init__(self, bucket: FakeBucket):
        self.bucket = bucket
        self.requested_bucket: str | None = None

    def from_(self, bucket: str) -> FakeBucket:
        self.requested_bucket = bucket
        return self.bucket


class FakeClient:
    def __init__(self, bucket: FakeBucket):
        self.storage = FakeStorage(bucket)


@pytest.mark.asyncio
async def test_upload_uses_private_path_content_type_and_no_upsert() -> None:
    bucket = FakeBucket()
    service = SupabaseStorageService(FakeClient(bucket))

    stored = await service.upload(
        "resumes",
        "user-id/resume-id/source.pdf",
        b"pdf-content",
        ResumeMimeType.PDF,
    )

    assert stored.bucket == "resumes"
    assert stored.path == "user-id/resume-id/source.pdf"
    assert stored.size_bytes == len(b"pdf-content")
    assert bucket.upload_call == (
        "user-id/resume-id/source.pdf",
        b"pdf-content",
        {"content-type": "application/pdf", "upsert": "false"},
    )


@pytest.mark.asyncio
async def test_download_returns_private_object_bytes() -> None:
    bucket = FakeBucket()
    service = SupabaseStorageService(FakeClient(bucket))

    content = await service.download(
        "resumes",
        "user-id/resume-id/source.pdf",
    )

    assert content == b"resume-content"
    assert bucket.download_call == "user-id/resume-id/source.pdf"


@pytest.mark.asyncio
async def test_delete_removes_exact_private_object_path() -> None:
    bucket = FakeBucket()
    service = SupabaseStorageService(FakeClient(bucket))

    await service.delete("resumes", "user-id/resume-id/source.pdf")

    assert bucket.remove_call == ["user-id/resume-id/source.pdf"]


@pytest.mark.asyncio
async def test_missing_download_is_translated_to_application_error() -> None:
    bucket = FakeBucket()
    bucket.error = StorageApiError("not found", "NoSuchKey", 404)
    service = SupabaseStorageService(FakeClient(bucket))

    with pytest.raises(StoredFileNotFoundError):
        await service.download("resumes", "missing.pdf")


@pytest.mark.asyncio
async def test_upload_failure_is_translated_to_application_error() -> None:
    bucket = FakeBucket()
    bucket.error = StorageApiError("storage unavailable", "InternalError", 500)
    service = SupabaseStorageService(FakeClient(bucket))

    with pytest.raises(FileStorageError):
        await service.upload(
            "resumes",
            "user-id/resume-id/source.pdf",
            b"pdf-content",
            ResumeMimeType.PDF,
        )

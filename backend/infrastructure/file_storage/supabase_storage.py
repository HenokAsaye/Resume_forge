from httpx import HTTPError
from storage3.exceptions import StorageApiError
from supabase import AsyncClient

from application.exceptions import FileStorageError, StoredFileNotFoundError
from application.interfaces.services.file_storage_service import (
    FileStorageService,
    StoredFile,
)
from domain.entities.resume import ResumeMimeType


class SupabaseStorageService(FileStorageService):
    def __init__(self, client: AsyncClient):
        self._client = client

    async def upload(
        self,
        bucket: str,
        path: str,
        content: bytes,
        content_type: ResumeMimeType,
    ) -> StoredFile:
        try:
            await self._client.storage.from_(bucket).upload(
                path,
                content,
                {
                    "content-type": content_type.value,
                    "upsert": "false",
                },
            )
        except (HTTPError, StorageApiError) as exc:
            raise FileStorageError("Unable to upload resume file") from exc

        return StoredFile(
            bucket=bucket,
            path=path,
            content_type=content_type,
            size_bytes=len(content),
        )

    async def download(self, bucket: str, path: str) -> bytes:
        try:
            return await self._client.storage.from_(bucket).download(path)
        except StorageApiError as exc:
            if self._is_not_found(exc):
                raise StoredFileNotFoundError("Resume file not found") from exc
            raise FileStorageError("Unable to download resume file") from exc
        except HTTPError as exc:
            raise FileStorageError("Unable to download resume file") from exc

    async def delete(self, bucket: str, path: str) -> None:
        try:
            await self._client.storage.from_(bucket).remove([path])
        except StorageApiError as exc:
            if self._is_not_found(exc):
                raise StoredFileNotFoundError("Resume file not found") from exc
            raise FileStorageError("Unable to delete resume file") from exc
        except HTTPError as exc:
            raise FileStorageError("Unable to delete resume file") from exc

    @staticmethod
    def _is_not_found(error: StorageApiError) -> bool:
        return str(error.status) == "404"

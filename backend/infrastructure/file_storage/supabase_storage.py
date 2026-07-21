from typing import Optional

from supabase import Client

from domain.interfaces.services.file_storage_service import FileStorageService


class SupabaseStorageService(FileStorageService):
    def __init__(self, client: Client):
        self._client = client

    async def upload(self, bucket: str, path: str, content: bytes) -> str:
        result = self._client.storage.from_(bucket).upload(
            path, content, {"content-type": "application/octet-stream"}
        )
        public_url = self._client.storage.from_(bucket).get_public_url(path)
        return public_url

    async def download(self, bucket: str, path: str) -> Optional[bytes]:
        result = self._client.storage.from_(bucket).download(path)
        return result

    async def delete(self, bucket: str, path: str) -> None:
        self._client.storage.from_(bucket).remove([path])

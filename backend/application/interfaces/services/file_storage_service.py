from abc import ABC, abstractmethod
from dataclasses import dataclass

from domain.entities.resume import ResumeMimeType


@dataclass(frozen=True, slots=True)
class StoredFile:
    bucket: str
    path: str
    content_type: ResumeMimeType
    size_bytes: int


class FileStorageService(ABC):
    @abstractmethod
    async def upload(
        self,
        bucket: str,
        path: str,
        content: bytes,
        content_type: ResumeMimeType,
    ) -> StoredFile:
        """Store a new private object without overwriting an existing path."""

    @abstractmethod
    async def download(self, bucket: str, path: str) -> bytes:
        """Download a private object."""

    @abstractmethod
    async def delete(self, bucket: str, path: str) -> None:
        """Delete a private object."""

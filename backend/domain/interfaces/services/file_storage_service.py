from abc import ABC, abstractmethod
from typing import Optional


class FileStorageService(ABC):
    @abstractmethod
    async def upload(self, bucket: str, path: str, content: bytes) -> str:
        pass

    @abstractmethod
    async def download(self, bucket: str, path: str) -> Optional[bytes]:
        pass

    @abstractmethod
    async def delete(self, bucket: str, path: str) -> None:
        pass

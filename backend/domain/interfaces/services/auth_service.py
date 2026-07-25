from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str
    email: str
    name: str | None
    created_at: datetime


@dataclass(frozen=True)
class AuthTokens:
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"


@dataclass(frozen=True)
class AuthenticationResult:
    user: AuthenticatedUser
    tokens: AuthTokens | None


class AuthService(ABC):
    @abstractmethod
    async def register(
        self,
        email: str,
        password: str,
        name: str,
    ) -> AuthenticationResult:
        pass

    @abstractmethod
    async def login(self, email: str, password: str) -> AuthenticationResult:
        pass

    @abstractmethod
    async def refresh(self, refresh_token: str) -> AuthenticationResult:
        pass

    @abstractmethod
    async def get_user(self, access_token: str) -> AuthenticatedUser:
        pass

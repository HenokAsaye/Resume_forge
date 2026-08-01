from datetime import datetime, timezone

import pytest
import pytest_asyncio
from domain.exceptions import AuthenticationError
from domain.interfaces.services.auth_service import (
    AuthenticatedUser,
    AuthenticationResult,
    AuthService,
    AuthTokens,
)
from httpx import ASGITransport, AsyncClient
from interfaces.api.deps import get_auth_service
from main import create_app


class FakeAuthService(AuthService):
    def __init__(self) -> None:
        self.user = AuthenticatedUser(
            id="3f9c0000-0000-0000-0000-000000000001",
            email="jane@example.com",
            name="Jane Doe",
            created_at=datetime(2026, 7, 25, 10, 0, tzinfo=timezone.utc),
        )
        self.tokens = AuthTokens(
            access_token="access-token",
            refresh_token="refresh-token",
            expires_in=3600,
        )
        self.registration_has_session = True
        self.login_error: AuthenticationError | None = None
        self.refresh_error: AuthenticationError | None = None
        self.user_error: AuthenticationError | None = None
        self.last_password: str | None = None

    async def register(
        self,
        email: str,
        password: str,
        name: str,
    ) -> AuthenticationResult:
        self.last_password = password
        user = AuthenticatedUser(
            id=self.user.id,
            email=email,
            name=name,
            created_at=self.user.created_at,
        )
        tokens = self.tokens if self.registration_has_session else None
        return AuthenticationResult(user=user, tokens=tokens)

    async def login(self, email: str, password: str) -> AuthenticationResult:
        self.last_password = password
        if self.login_error:
            raise self.login_error
        return AuthenticationResult(user=self.user, tokens=self.tokens)

    async def refresh(self, refresh_token: str) -> AuthenticationResult:
        if self.refresh_error:
            raise self.refresh_error
        return AuthenticationResult(user=self.user, tokens=self.tokens)

    async def get_user(self, access_token: str) -> AuthenticatedUser:
        if self.user_error:
            raise self.user_error
        return self.user


@pytest.fixture
def auth_service() -> FakeAuthService:
    return FakeAuthService()


@pytest_asyncio.fixture
async def client(auth_service: FakeAuthService):
    app = create_app()

    async def override_auth_service() -> AuthService:
        return auth_service

    app.dependency_overrides[get_auth_service] = override_auth_service
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
    ) as http_client:
        yield http_client


@pytest.mark.asyncio
async def test_register_returns_tokens(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "jane@example.com",
            "password": "secret123",
            "name": "Jane Doe",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "access_token": "access-token",
        "refresh_token": "refresh-token",
        "expires_in": 3600,
        "token_type": "bearer",
        "user_id": "3f9c0000-0000-0000-0000-000000000001",
        "email": "jane@example.com",
        "name": "Jane Doe",
        "requires_email_confirmation": False,
    }


@pytest.mark.asyncio
async def test_register_supports_email_confirmation(
    client: AsyncClient,
    auth_service: FakeAuthService,
) -> None:
    auth_service.registration_has_session = False

    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "jane@example.com",
            "password": "secret123",
            "name": "Jane Doe",
        },
    )

    assert response.status_code == 200
    assert response.json()["access_token"] is None
    assert response.json()["refresh_token"] is None
    assert response.json()["requires_email_confirmation"] is True


@pytest.mark.asyncio
async def test_register_validates_email_and_password(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "short", "name": ""},
    )

    assert response.status_code == 422
    locations = {tuple(item["loc"]) for item in response.json()["detail"]}
    assert ("body", "email") in locations
    assert ("body", "password") in locations
    assert ("body", "name") in locations


@pytest.mark.asyncio
async def test_password_is_not_trimmed(
    client: AsyncClient,
    auth_service: FakeAuthService,
) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": " jane@example.com ", "password": " secret123 "},
    )

    assert response.status_code == 200
    assert auth_service.last_password == " secret123 "


@pytest.mark.asyncio
async def test_login_rejects_invalid_credentials(
    client: AsyncClient,
    auth_service: FakeAuthService,
) -> None:
    auth_service.login_error = AuthenticationError("Invalid email or password")

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "jane@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.asyncio
async def test_refresh_returns_rotated_session(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "old-refresh-token"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "access-token"
    assert response.json()["refresh_token"] == "refresh-token"


@pytest.mark.asyncio
async def test_me_requires_bearer_token(client: AsyncClient) -> None:
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json() == {"detail": "Missing or invalid Authorization header"}


@pytest.mark.asyncio
async def test_me_returns_authenticated_user(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer access-token"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": "3f9c0000-0000-0000-0000-000000000001",
        "email": "jane@example.com",
        "name": "Jane Doe",
        "created_at": "2026-07-25T10:00:00Z",
    }


@pytest.mark.asyncio
async def test_me_rejects_expired_access_token(
    client: AsyncClient,
    auth_service: FakeAuthService,
) -> None:
    auth_service.user_error = AuthenticationError("Invalid or expired access token")

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer expired-token"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or expired access token"}

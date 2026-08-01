from datetime import datetime, timezone
from typing import Any

from anyio import to_thread
from supabase import Client

from domain.exceptions import AuthenticationError, RegistrationError
from domain.interfaces.services.auth_service import (
    AuthenticatedUser,
    AuthenticationResult,
    AuthService,
    AuthTokens,
)

try:
    from supabase_auth.errors import AuthApiError
except ImportError:  # Compatibility with older supabase-py releases.
    from gotrue.errors import AuthApiError


class SupabaseAuthService(AuthService):
    def __init__(self, client: Client):
        self._client = client

    async def register(
        self,
        email: str,
        password: str,
        name: str,
    ) -> AuthenticationResult:
        try:
            response = await to_thread.run_sync(
                lambda: self._client.auth.sign_up(
                    {
                        "email": email,
                        "password": password,
                        "options": {"data": {"name": name}},
                    }
                )
            )
        except AuthApiError as exc:
            message = self._safe_message(exc, "Unable to register user")
            raise RegistrationError(message) from exc

        if response.user is None:
            raise RegistrationError("Supabase did not return a user after registration")

        return self._build_result(response.user, response.session)

    async def login(self, email: str, password: str) -> AuthenticationResult:
        try:
            response = await to_thread.run_sync(
                lambda: self._client.auth.sign_in_with_password(
                    {"email": email, "password": password}
                )
            )
        except AuthApiError as exc:
            raise AuthenticationError("Invalid email or password") from exc

        if response.user is None or response.session is None:
            raise AuthenticationError("Invalid email or password")

        return self._build_result(response.user, response.session)

    async def refresh(self, refresh_token: str) -> AuthenticationResult:
        try:
            response = await to_thread.run_sync(
                lambda: self._client.auth.refresh_session(refresh_token)
            )
        except AuthApiError as exc:
            raise AuthenticationError("Invalid or expired refresh token") from exc

        if response.user is None or response.session is None:
            raise AuthenticationError("Invalid or expired refresh token")

        return self._build_result(response.user, response.session)

    async def get_user(self, access_token: str) -> AuthenticatedUser:
        try:
            response = await to_thread.run_sync(
                lambda: self._client.auth.get_user(access_token)
            )
        except AuthApiError as exc:
            message = self._safe_message(exc, "Invalid or expired access token")
            raise AuthenticationError(message) from exc

        if response.user is None:
            raise AuthenticationError("Invalid or expired access token")

        return self._build_user(response.user)

    def _build_result(self, user: Any, session: Any | None) -> AuthenticationResult:
        tokens = None
        if session is not None:
            tokens = AuthTokens(
                access_token=session.access_token,
                refresh_token=session.refresh_token,
                expires_in=session.expires_in,
                token_type=getattr(session, "token_type", "bearer"),
            )

        return AuthenticationResult(
            user=self._build_user(user),
            tokens=tokens,
        )

    @staticmethod
    def _build_user(user: Any) -> AuthenticatedUser:
        metadata = user.user_metadata or {}
        created_at = SupabaseAuthService._parse_datetime(user.created_at)
        return AuthenticatedUser(
            id=str(user.id),
            email=user.email or "",
            name=metadata.get("name"),
            created_at=created_at,
        )

    @staticmethod
    def _parse_datetime(value: str | datetime | None) -> datetime:
        if isinstance(value, datetime):
            return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        if value:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        return datetime.now(timezone.utc)

    @staticmethod
    def _safe_message(exc: AuthApiError, fallback: str) -> str:
        message = getattr(exc, "message", None)
        return message if isinstance(message, str) and message else fallback

from domain.interfaces.services.auth_service import AuthenticationResult, AuthService


class RefreshSessionUseCase:
    def __init__(self, auth_service: AuthService):
        self._auth_service = auth_service

    async def execute(self, refresh_token: str) -> AuthenticationResult:
        return await self._auth_service.refresh(refresh_token)

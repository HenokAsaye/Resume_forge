from domain.interfaces.services.auth_service import AuthenticationResult, AuthService


class LoginUserUseCase:
    def __init__(self, auth_service: AuthService):
        self._auth_service = auth_service

    async def execute(self, email: str, password: str) -> AuthenticationResult:
        return await self._auth_service.login(email=email, password=password)

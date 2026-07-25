from domain.interfaces.services.auth_service import AuthenticationResult, AuthService


class RegisterUserUseCase:
    def __init__(self, auth_service: AuthService):
        self._auth_service = auth_service

    async def execute(
        self,
        email: str,
        password: str,
        name: str,
    ) -> AuthenticationResult:
        return await self._auth_service.register(
            email=email,
            password=password,
            name=name,
        )

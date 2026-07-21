import uuid
from datetime import datetime

from domain.entities.user import User
from domain.interfaces.repositories.user_repository import UserRepository


class RegisterUserUseCase:
    def __init__(self, user_repo: UserRepository):
        self._user_repo = user_repo

    async def execute(self, email: str, name: str, supabase_uid: str) -> User:
        user = User(
            id=supabase_uid,
            email=email,
            name=name,
            created_at=datetime.utcnow(),
        )
        return await self._user_repo.create(user)

from domain.entities.user import User
from domain.interfaces.repositories.user_repository import UserRepository

from supabase import Client


class SupabaseUserRepository(UserRepository):
    def __init__(self, client: Client):
        self._client = client

    async def create(self, user: User) -> User:
        self._client.table("profiles").insert(
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "created_at": user.created_at.isoformat(),
            }
        ).execute()
        return user

    async def get_by_id(self, user_id: str) -> User | None:
        result = self._client.table("profiles").select("*").eq("id", user_id).execute()
        if not result.data:
            return None
        data = result.data[0]
        return User(**data)

    async def get_by_email(self, email: str) -> User | None:
        result = self._client.table("profiles").select("*").eq("email", email).execute()
        if not result.data:
            return None
        data = result.data[0]
        return User(**data)

from config import Settings

from supabase import AsyncClient, Client, acreate_client, create_client


def create_supabase_client(settings: Settings) -> Client:
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured"
        )
    return create_client(settings.supabase_url, settings.supabase_publishable_key)


async def create_async_supabase_client(settings: Settings) -> AsyncClient:
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured"
        )
    return await acreate_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
    )


def create_supabase_admin_client(settings: Settings) -> Client:
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SECRET_KEY must be configured")
    return create_client(settings.supabase_url, settings.supabase_secret_key)

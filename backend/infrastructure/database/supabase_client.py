from supabase import Client, create_client

from config import Settings


def create_supabase_client(settings: Settings) -> Client:
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured"
        )
    return create_client(settings.supabase_url, settings.supabase_publishable_key)


def create_supabase_admin_client(settings: Settings) -> Client:
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SECRET_KEY must be configured")
    return create_client(settings.supabase_url, settings.supabase_secret_key)

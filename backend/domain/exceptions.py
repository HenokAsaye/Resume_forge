class AuthenticationError(Exception):
    """Raised when credentials or a session token cannot be authenticated."""


class RegistrationError(Exception):
    """Raised when Supabase cannot create an authentication account."""

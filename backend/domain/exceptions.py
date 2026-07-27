class AuthenticationError(Exception):
    """Raised when credentials or a session token cannot be authenticated."""


class RegistrationError(Exception):
    """Raised when Supabase cannot create an authentication account."""


class ResumeRepositoryError(Exception):
    """Raised when resume persistence fails."""


class ResumeNotFoundError(ResumeRepositoryError):
    """Raised when a requested resume does not exist for the current owner."""


class ResumeVersionConflictError(ResumeRepositoryError):
    """Raised when a resume version number already exists."""

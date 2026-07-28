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


class ResumeVersionNotFoundError(ResumeRepositoryError):
    """Raised when an owned resume version does not exist."""


class CareerRepositoryError(Exception):
    """Raised when job, ATS, or cover-letter persistence fails."""


class JobNotFoundError(CareerRepositoryError):
    """Raised when an owned job does not exist."""


class ATSReportNotFoundError(CareerRepositoryError):
    """Raised when an owned ATS report does not exist."""


class CoverLetterNotFoundError(CareerRepositoryError):
    """Raised when an owned cover letter does not exist."""


class ResumeNotParsedError(Exception):
    """Raised when an operation requires parsed resume data."""


class JobNotParsedError(Exception):
    """Raised when an operation requires parsed job data."""

class FileValidationError(Exception):
    """Base error for rejected uploaded files."""


class EmptyFileError(FileValidationError):
    """Raised when an uploaded file contains no bytes."""


class FileTooLargeError(FileValidationError):
    """Raised when an uploaded file exceeds its configured size limit."""


class UnsupportedFileTypeError(FileValidationError):
    """Raised when an extension or MIME type is not allowed."""


class InvalidFileContentError(FileValidationError):
    """Raised when bytes do not contain a valid supported document."""


class FileStorageError(Exception):
    """Base error for private object-storage failures."""


class StoredFileNotFoundError(FileStorageError):
    """Raised when a requested private object does not exist."""


class DocumentTextExtractionError(Exception):
    """Base error raised when document text extraction fails."""


class UnsupportedDocumentTypeError(DocumentTextExtractionError):
    """Raised when no extractor exists for the supplied document type."""


class NoExtractableTextError(DocumentTextExtractionError):
    """Raised when a valid document does not contain extractable text."""


class AIServiceError(Exception):
    """Base error raised by application-facing AI services."""


class AIConfigurationError(AIServiceError):
    """Raised when no LLM provider credential is configured."""


class ResumeParsingError(AIServiceError):
    """Base error raised when resume parsing fails."""


class EmptyResumeTextError(ResumeParsingError):
    """Raised when the extracted resume text is empty."""


class EmptyJobTextError(AIServiceError):
    """Raised when a job description contains no text."""


class LLMAuthenticationError(AIServiceError):
    """Raised when the LLM provider rejects the request due to authentication issues."""


class LLMRateLimitError(AIServiceError):
    """Raised when the LLM provider rejects the request due to rate limiting."""


class LLMProviderError(AIServiceError):
    """Raised when the LLM provider returns an error response."""


class LLMResponseError(AIServiceError):
    """Raised when the LLM provider returns an invalid or unexpected response."""

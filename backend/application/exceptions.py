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

class ServiceError(Exception):
    """Base exception for doc_verify_service."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class InvalidFileTypeError(ServiceError):
    def __init__(self, message: str = "Unsupported file type"):
        super().__init__(message, status_code=400)


class FileTooLargeError(ServiceError):
    def __init__(self, message: str = "File exceeds max allowed size"):
        super().__init__(message, status_code=413)


class OCRExtractionError(ServiceError):
    def __init__(self, message: str = "Failed to extract text from document"):
        super().__init__(message, status_code=422)


class DocumentClassificationError(ServiceError):
    def __init__(self, message: str = "Failed to classify document"):
        super().__init__(message, status_code=422)


class MissingFieldError(ServiceError):
    def __init__(self, message: str = "Required field missing in document"):
        super().__init__(message, status_code=422)
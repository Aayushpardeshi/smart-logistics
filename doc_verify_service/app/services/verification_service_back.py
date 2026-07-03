from loguru import logger
from app.services.document_parser_back import parse_back_document
from app.schemas.document import (
    LicenceBackResponse,
    LicenceBackFields,
    DocumentType,
)


def verify_back_document(
    file_bytes: bytes, filename: str
) -> LicenceBackResponse:
    logger.info(f"Starting back side verification for: {filename}")

    try:
        raw_text, back_fields = parse_back_document(file_bytes, filename)
        logger.info("Back side verification complete")

        return LicenceBackResponse(
            document_type=DocumentType.DRIVING_LICENCE_BACK,
            licence_back_fields=back_fields,
            raw_text=raw_text,
            error=None,
        )

    except Exception as e:
        logger.error(f"Back side verification failed: {e}")
        return LicenceBackResponse(
            document_type=DocumentType.DRIVING_LICENCE_BACK,
            licence_back_fields=LicenceBackFields(),
            raw_text=None,
            error=str(e),
        )
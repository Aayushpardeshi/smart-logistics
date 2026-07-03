from loguru import logger
from app.services.document_parser import parse_document
from app.services.document_parser_back import parse_back_document
from app.services.fraud_detector import check_fraud
from app.ai.classifier import classify_document
from app.schemas.document import (
    CombinedLicenceResponse,
    LicenceFields,
    LicenceBackFields,
    DocumentType,
    FraudStatus,
)


def verify_combined_document(
    front_bytes: bytes,
    front_filename: str,
    back_bytes: bytes,
    back_filename: str,
) -> CombinedLicenceResponse:
    """
    Combined pipeline for front + back of driving licence.

    Front: OCR → field extraction → fraud detection
    Back:  OCR → vehicle classes + emergency contact
    Back licence_number filled from front if missing.
    """
    logger.info(
        f"Starting combined verification | "
        f"front={front_filename} | back={back_filename}"
    )

    try:
        # ── Front Side ─────────────────────────────────────────
        logger.info("Processing front side...")
        raw_text_front, extracted_fields, front_fields = parse_document(
            front_bytes, front_filename
        )

        # Classify using front text
        document_type, confidence_score = classify_document(raw_text_front)

        # Fraud check using front fields
        fraud_status, reasons = check_fraud(
            raw_text_front, extracted_fields, front_fields
        )

        logger.info(
            f"Front done: {document_type} | "
            f"{fraud_status} | confidence={confidence_score}"
        )

        # ── Back Side ──────────────────────────────────────────
        logger.info("Processing back side...")
        raw_text_back, back_fields = parse_back_document(
            back_bytes, back_filename
        )

        # Fill licence_number from front if back OCR missed it
        if not back_fields.licence_number and front_fields.licence_number:
            back_fields.licence_number = front_fields.licence_number
            logger.info(
                f"Licence number carried from front: "
                f"{front_fields.licence_number}"
            )

        logger.info("Back done")

        return CombinedLicenceResponse(
            document_type=DocumentType.DRIVING_LICENCE_COMBINED,
            fraud_status=fraud_status,
            confidence_score=confidence_score,
            front=front_fields,
            back=back_fields,
            raw_text_front=raw_text_front,
            raw_text_back=raw_text_back,
            error=None,
        )

    except Exception as e:
        logger.error(f"Combined verification failed: {e}")
        return CombinedLicenceResponse(
            document_type=DocumentType.DRIVING_LICENCE_COMBINED,
            fraud_status=FraudStatus.SUSPICIOUS,
            confidence_score=0.0,
            front=LicenceFields(),
            back=LicenceBackFields(),
            raw_text_front=None,
            raw_text_back=None,
            error=str(e),
        )
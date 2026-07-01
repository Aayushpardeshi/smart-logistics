from loguru import logger
from app.services.document_parser import parse_document
from app.services.fraud_detector import check_fraud
from app.ai.classifier import classify_document
from app.schemas.document import (
    VerificationResponse,
    FraudStatus,
    DocumentType,
    LicenceFields,
)


def verify_document(file_bytes: bytes, filename: str) -> VerificationResponse:
    """
    Main pipeline orchestrator.
    OCR → Classification → Fraud Detection → Response
    """
    logger.info(f"Starting verification for: {filename}")

    try:
        # Step 1: Extract text, generic fields, licence fields
        logger.info("Step 1: Parsing document...")
        raw_text, extracted_fields, licence_fields = parse_document(
            file_bytes, filename
        )

        # Step 2: Classify document type
        logger.info("Step 2: Classifying document...")
        document_type, confidence_score = classify_document(raw_text)

        # Step 3: Fraud detection
        logger.info("Step 3: Running fraud checks...")
        fraud_status, reasons = check_fraud(
            raw_text, extracted_fields, licence_fields
        )

        logger.info(
            f"Verification complete: {document_type} | "
            f"{fraud_status} | confidence: {confidence_score}"
        )

        return VerificationResponse(
            document_type=document_type,
            fraud_status=fraud_status,
            confidence_score=confidence_score,
            extracted_fields=extracted_fields,
            licence_fields=licence_fields,
            raw_text=raw_text,
            error=None,
        )

    except Exception as e:
        logger.error(f"Verification pipeline failed: {e}")
        return VerificationResponse(
            document_type=DocumentType.UNKNOWN,
            fraud_status=FraudStatus.SUSPICIOUS,
            confidence_score=0.0,
            extracted_fields=[],
            licence_fields=LicenceFields(),
            raw_text=None,
            error=str(e),
        )
from loguru import logger
from app.services.document_parser_rc import parse_rc_document
from app.services.fraud_detector import check_fraud_rc
from app.ai.classifier import classify_document
from app.schemas.document import RCResponse, FraudStatus, DocumentType, RCFields


def verify_rc_document(file_bytes: bytes, filename: str) -> RCResponse:
    logger.info(f"Starting RC verification for: {filename}")

    try:
        raw_text, rc_fields = parse_rc_document(file_bytes, filename)

        document_type, confidence_score = classify_document(raw_text)

        fraud_status, reasons = check_fraud_rc(raw_text, rc_fields)

        logger.info(
            f"RC verification complete: {document_type} | "
            f"{fraud_status} | confidence: {confidence_score}"
        )

        return RCResponse(
            document_type=document_type,
            fraud_status=fraud_status,
            confidence_score=confidence_score,
            rc_fields=rc_fields,
            raw_text=raw_text,
            error=None,
        )

    except Exception as e:
        logger.error(f"RC verification pipeline failed: {e}")
        return RCResponse(
            document_type=DocumentType.UNKNOWN,
            fraud_status=FraudStatus.SUSPICIOUS,
            confidence_score=0.0,
            rc_fields=RCFields(),
            raw_text=None,
            error=str(e),
        )
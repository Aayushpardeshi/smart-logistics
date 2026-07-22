from loguru import logger
from app.services.document_parser_aadhaar import parse_aadhaar_front
from app.services.document_parser_aadhaar_back import parse_aadhaar_back
from app.schemas.document import (
    AadhaarCombinedResponse,
    AadhaarFrontFields,
    AadhaarBackFields,
    DocumentType,
    FraudStatus,
)


def check_aadhaar_fraud(
    raw_text: str,
    front_fields: AadhaarFrontFields,
    back_fields: AadhaarBackFields,
) -> tuple[FraudStatus, list[str]]:
    reasons = []

    SUSPICIOUS_KEYWORDS = [
        "void", "sample", "specimen", "fake",
        "test", "dummy", "cancelled", "invalid",
        "colour copy", "color copy",
    ]
    text_lower = raw_text.lower()
    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in text_lower:
            reasons.append(f"Suspicious keyword: '{keyword}'")
            logger.warning(f"Aadhaar fraud: suspicious keyword '{keyword}'")

    if not front_fields.aadhaar_number:
        reasons.append("Aadhaar number not found on front")

    if not front_fields.name:
        reasons.append("Name could not be extracted")

    if not back_fields.address:
        reasons.append("Address not found on back")

    if (
        front_fields.aadhaar_number
        and back_fields.aadhaar_number
        and front_fields.aadhaar_number != back_fields.aadhaar_number
    ):
        reasons.append("Aadhaar number mismatch front vs back")

    if len(reasons) >= 3:
        status = FraudStatus.FRAUDULENT
    elif len(reasons) >= 1:
        status = FraudStatus.SUSPICIOUS
    else:
        status = FraudStatus.CLEAN

    logger.info(f"Aadhaar fraud: {status} | Reasons: {reasons}")
    return status, reasons


def verify_aadhaar_combined(
    front_bytes: bytes,
    front_filename: str,
    back_bytes: bytes,
    back_filename: str,
) -> AadhaarCombinedResponse:
    """
    Combined Aadhaar verification pipeline.
    """
    logger.info(
        f"Aadhaar combined | "
        f"front={front_filename} | back={back_filename}"
    )

    # Safe defaults
    front_fields = AadhaarFrontFields()
    back_fields = AadhaarBackFields()
    raw_text_front = ""
    raw_text_back = ""

    try:
        # ── Front ──────────────────────────────────────────────
        logger.info("Processing Aadhaar front...")
        raw_text_front, front_fields = parse_aadhaar_front(
            front_bytes, front_filename
        )

        # ── Back ───────────────────────────────────────────────
        logger.info("Processing Aadhaar back...")
        raw_text_back, back_fields = parse_aadhaar_back(
            back_bytes, back_filename
        )

        # Carry Aadhaar number from front if back missed it
        if not back_fields.aadhaar_number and front_fields.aadhaar_number:
            back_fields.aadhaar_number = front_fields.aadhaar_number
            logger.info(
                f"Aadhaar number carried from front: "
                f"{front_fields.aadhaar_number}"
            )

        # ── Confidence ─────────────────────────────────────────
        confidence_score = 0.95 if front_fields.aadhaar_number else 0.5

        # ── Fraud Check ────────────────────────────────────────
        combined_text = raw_text_front + " " + raw_text_back
        fraud_status, reasons = check_aadhaar_fraud(
            combined_text, front_fields, back_fields
        )

        logger.info(f"Aadhaar complete | fraud={fraud_status}")

        return AadhaarCombinedResponse(
            document_type=DocumentType.AADHAAR_COMBINED,
            fraud_status=fraud_status,
            confidence_score=confidence_score,
            front=front_fields,
            back=back_fields,
            raw_text_front=raw_text_front,
            raw_text_back=raw_text_back,
            error=None,
        )

    except Exception as e:
        logger.error(f"Aadhaar verification failed: {e}")

        # Always return valid object — never None
        return AadhaarCombinedResponse(
            document_type=DocumentType.AADHAAR_COMBINED,
            fraud_status=FraudStatus.SUSPICIOUS,
            confidence_score=0.0,
            front=front_fields,
            back=back_fields,
            raw_text_front=raw_text_front or None,
            raw_text_back=raw_text_back or None,
            error=str(e),
        )
from loguru import logger
from app.schemas.document import FraudStatus, ExtractedField, LicenceFields
from datetime import datetime


SUSPICIOUS_KEYWORDS = [
    "void", "sample", "specimen", "fake",
    "test", "dummy", "cancelled", "invalid",
]


def check_fraud(
    raw_text: str,
    extracted_fields: list[ExtractedField],
    licence_fields: LicenceFields,
) -> tuple[FraudStatus, list[str]]:
    """
    Run fraud checks on extracted text and fields.
    Returns fraud status and list of reasons.
    """
    reasons = []

    # Check 1: suspicious keywords
    text_lower = raw_text.lower()
    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in text_lower:
            reasons.append(f"Suspicious keyword found: '{keyword}'")
            logger.warning(f"Fraud check: suspicious keyword '{keyword}'")

    # Check 2: check validity date (NOT issue date)
    if licence_fields.validity_nt:
        if is_expired(licence_fields.validity_nt):
            reasons.append(f"Licence expired: {licence_fields.validity_nt}")
            logger.warning(f"Fraud check: licence expired {licence_fields.validity_nt}")
        else:
            logger.info(f"Licence valid until: {licence_fields.validity_nt}")
    else:
        reasons.append("Validity date could not be extracted")
        logger.warning("Fraud check: missing validity date")

    # Check 3: no text extracted
    if not raw_text or len(raw_text.strip()) < 20:
        reasons.append("Document has little or no readable text")
        logger.warning("Fraud check: insufficient text")

    # Check 4: critical fields missing
    critical_missing = []
    if not licence_fields.licence_number:
        critical_missing.append("licence_number")
    if not licence_fields.name:
        critical_missing.append("name")
    if not licence_fields.date_of_birth:
        critical_missing.append("date_of_birth")

    if len(critical_missing) >= 2:
        reasons.append(f"Critical fields missing: {critical_missing}")
        logger.warning(f"Fraud check: missing fields {critical_missing}")

    # Determine status
    if len(reasons) >= 3:
        status = FraudStatus.FRAUDULENT
    elif len(reasons) >= 1:
        status = FraudStatus.SUSPICIOUS
    else:
        status = FraudStatus.CLEAN

    logger.info(f"Fraud status: {status} | Reasons: {reasons}")
    return status, reasons


def is_expired(date_str: str) -> bool:
    """
    Check if validity date is in the past.
    """
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y"):
        try:
            doc_date = datetime.strptime(date_str, fmt)
            return doc_date < datetime.now()
        except ValueError:
            continue
    return False
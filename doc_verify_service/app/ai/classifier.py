from loguru import logger
from app.schemas.document import DocumentType


DOCUMENT_KEYWORDS = {
    DocumentType.DRIVING_LICENCE: [
        "driving licence", "driving license", "dl no", "licence no",
        "validity", "transport", "non-transport", "issue date",
        "blood group", "organ donor", "motor vehicles act",
        "rto", "regional transport", "maharashtra", "issued by government",
    ],
    DocumentType.INVOICE: [
        "invoice", "bill to", "ship to", "gst", "gstin",
        "total amount", "tax invoice", "payment due", "item", "qty",
    ],
    DocumentType.INSURANCE: [
        "insurance", "policy number", "premium", "insured",
        "coverage", "claim", "nominee", "sum assured",
    ],
    DocumentType.ID_CARD: [
        "aadhaar", "pan card", "voter id", "employee id",
        "identity card", "uid", "identification",
    ],
}


def classify_document(text: str) -> tuple[DocumentType, float]:
    """
    Classify document type using keyword matching.
    No ML model required — fast and reliable for known doc types.
    """
    if not text or len(text.strip()) < 10:
        logger.warning("Text too short for classification")
        return DocumentType.UNKNOWN, 0.0

    text_lower = text.lower()
    scores: dict[DocumentType, int] = {}

    for doc_type, keywords in DOCUMENT_KEYWORDS.items():
        matched = sum(1 for kw in keywords if kw in text_lower)
        if matched > 0:
            scores[doc_type] = matched
            logger.info(f"{doc_type}: {matched} keyword matches")

    if not scores:
        logger.warning("No keywords matched — document unknown")
        return DocumentType.UNKNOWN, 0.0

    best_type = max(scores, key=lambda k: scores[k])
    total_keywords = len(DOCUMENT_KEYWORDS[best_type])
    confidence = round(min(scores[best_type] / total_keywords, 1.0), 4)

    logger.info(f"Classified as: {best_type} | confidence: {confidence}")
    return best_type, confidence
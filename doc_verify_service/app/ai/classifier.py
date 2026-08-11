from loguru import logger
from app.schemas.document import DocumentType


DOCUMENT_KEYWORDS = {
    DocumentType.DRIVING_LICENCE: [
        "driving licence", "driving license", "dl no", "licence no",
        "validity", "issue date", "blood group", "organ donor",
        "motor vehicles act", "rto", "regional transport",
        "maharashtra", "issued by government", "valid till",
        "doi", "mcwg", "lmv", "non-transport",
    ],
    DocumentType.AADHAAR: [
        "aadhaar", "aadhar", "unique identification",
        "government of india", "uidai", "year of birth",
        "enrolment", "vid", "आधार", "भारत सरकार",
        "male", "female", "father", "husband",
    ],
    DocumentType.INVOICE: [
        "invoice", "bill to", "ship to", "gst", "gstin",
        "total amount", "tax invoice", "payment due",
    ],
    DocumentType.INSURANCE: [
        "insurance", "policy number", "premium", "insured",
        "coverage", "claim", "nominee", "sum assured",
    ],
    DocumentType.ID_CARD: [
        "pan card", "voter id", "employee id",
        "identity card", "uid", "identification",
    ],
    DocumentType.RC: [
        "registration certificate", "certificate of registration",
        "chassis no", "engine no", "rc no", "registering authority",
        "vahan", "class of vehicle", "maker", "fuel used",
        "owner name", "hypothecation", "financer",
    ],
    DocumentType.FITNESS_CERTIFICATE: [
        "fitness certificate", "certificate of fitness", "fit upto",
        "fitness upto", "fitness valid", "motor vehicles department",
        "inspecting authority", "roadworthiness",
    ],
    DocumentType.PUC: [
        "pollution under control", "puc certificate", "emission test",
        "pollution certificate", "co reading", "hc reading",
        "smoke density", "valid upto", "testing center",
    ],
}


def classify_document(text: str) -> tuple[DocumentType, float]:
    """
    Classify document type using keyword matching.
    No ML model — fast and reliable for known Indian doc types.
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
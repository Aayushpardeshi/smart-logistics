import re
from loguru import logger
from app.ai.ocr_pipeline import extract_text
from app.schemas.document import PUCFields

def parse_puc_document(file_bytes: bytes, filename: str) -> tuple[str, PUCFields]:
    raw_text = extract_text(file_bytes, filename)
    if not raw_text:
        logger.warning("No text extracted from PUC document")
        return "", PUCFields()
    logger.info(f"PUC raw text extracted:\n{raw_text}")
    puc_fields = extract_puc_fields(raw_text)
    return raw_text, puc_fields

def extract_puc_fields(text: str) -> PUCFields:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    full_text = " ".join(lines)
    
    registration_number = None
    m = re.search(r"(?:reg(?:istration)?\s*no|vehicle\s*reg|vehicle\s*no)[:\s.-]+([A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,2}\s?\d{4})", full_text, re.IGNORECASE)
    if m:
        registration_number = re.sub(r"\s+", " ", m.group(1).strip())
    
    puc_certificate_number = None
    m = re.search(r"(?:puc\s*cert|certificate\s*no|cert\s*no)[:\s.-]+([A-Z0-9/-]{5,20})", full_text, re.IGNORECASE)
    if m:
        puc_certificate_number = m.group(1).strip()
        
    valid_upto = None
    m = re.search(r"(?:valid\s*upto|valid\s*till|expiry\s*date)[:\s.-]+(\d{2}[-/]\d{2}[-/]\d{4}|\d{2}\s+[A-Za-z]{3}\s+\d{4})", full_text, re.IGNORECASE)
    if m:
        valid_upto = m.group(1).strip()
        
    test_date = None
    m = re.search(r"(?:test\s*date|date\s*of\s*test)[:\s.-]+(\d{2}[-/]\d{2}[-/]\d{4}|\d{2}\s+[A-Za-z]{3}\s+\d{4})", full_text, re.IGNORECASE)
    if m:
        test_date = m.group(1).strip()

    testing_center = None
    
    fields = PUCFields(
        registration_number=registration_number,
        puc_certificate_number=puc_certificate_number,
        valid_upto=valid_upto,
        test_date=test_date,
        testing_center=testing_center
    )
    logger.info(f"PUC fields extracted: {fields.model_dump()}")
    return fields

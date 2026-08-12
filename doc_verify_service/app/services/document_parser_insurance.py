import re
from loguru import logger
from app.ai.ocr_pipeline import extract_text
from app.schemas.document import InsuranceFields

def parse_insurance_document(file_bytes: bytes, filename: str) -> tuple[str, InsuranceFields]:
    raw_text = extract_text(file_bytes, filename)
    if not raw_text:
        logger.warning("No text extracted from Insurance document")
        return "", InsuranceFields()
    logger.info(f"Insurance raw text extracted:\n{raw_text}")
    insurance_fields = extract_insurance_fields(raw_text)
    return raw_text, insurance_fields

def extract_insurance_fields(text: str) -> InsuranceFields:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    full_text = " ".join(lines)
    
    policy_number = None
    m = re.search(r"(?:policy\s*no|policy\s*num(?:ber)?|policy)[:\s.-]+([A-Z0-9/-]{6,25})", full_text, re.IGNORECASE)
    if m:
        policy_number = m.group(1).strip()

    insured_name = None
    m = re.search(r"(?:insured\s*name|name\s*of\s*insured|owner\s*name|name)[:\s.-]+([A-Za-z\s.]{3,30})", full_text, re.IGNORECASE)
    if m:
        insured_name = m.group(1).strip()
    
    registration_number = None
    m = re.search(r"(?:reg(?:istration)?\s*no|vehicle\s*reg|vehicle\s*no)[:\s.-]+([A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,2}\s?\d{4})", full_text, re.IGNORECASE)
    if m:
        registration_number = re.sub(r"\s+", " ", m.group(1).strip())
    
    insurer_name = None
    m = re.search(r"(?:insurer|company\s*name|insurance\s*company)[:\s.-]+([A-Za-z\s.]{3,40})", full_text, re.IGNORECASE)
    if m:
        insurer_name = m.group(1).strip()
        
    valid_from = None
    m = re.search(r"(?:valid\s*from|period\s*from|start\s*date)[:\s.-]+(\d{2}[-/]\d{2}[-/]\d{4}|\d{2}\s+[A-Za-z]{3}\s+\d{4})", full_text, re.IGNORECASE)
    if m:
        valid_from = m.group(1).strip()

    valid_until = None
    m = re.search(r"(?:valid\s*to|valid\s*until|expiry\s*date|to\s*date)[:\s.-]+(\d{2}[-/]\d{2}[-/]\d{4}|\d{2}\s+[A-Za-z]{3}\s+\d{4})", full_text, re.IGNORECASE)
    if m:
        valid_until = m.group(1).strip()

    fields = InsuranceFields(
        policy_number=policy_number,
        insured_name=insured_name,
        registration_number=registration_number,
        insurer_name=insurer_name,
        valid_from=valid_from,
        valid_until=valid_until
    )
    logger.info(f"Insurance fields extracted: {fields.model_dump()}")
    return fields

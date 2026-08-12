import re
from loguru import logger
from app.ai.ocr_pipeline import extract_text
from app.schemas.document import PermitFields

def parse_permit_document(file_bytes: bytes, filename: str) -> tuple[str, PermitFields]:
    raw_text = extract_text(file_bytes, filename)
    if not raw_text:
        logger.warning("No text extracted from Permit document")
        return "", PermitFields()
    logger.info(f"Permit raw text extracted:\n{raw_text}")
    permit_fields = extract_permit_fields(raw_text)
    return raw_text, permit_fields

def extract_permit_fields(text: str) -> PermitFields:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    full_text = " ".join(lines)
    
    permit_number = None
    m = re.search(r"(?:permit\s*no|permit\s*num(?:ber)?|p\.no)[:\s.-]+([A-Z0-9/-]{5,25})", full_text, re.IGNORECASE)
    if m:
        permit_number = m.group(1).strip()

    permit_type = None
    m = re.search(r"(national\s*permit|state\s*permit|goods\s*carrier\s*permit|all\s*india\s*permit)", full_text, re.IGNORECASE)
    if m:
        permit_type = m.group(1).title()

    holder_name = None
    m = re.search(r"(?:holder\s*name|name\s*of\s*holder|permit\s*holder)[:\s.-]+([A-Za-z\s.]{3,30})", full_text, re.IGNORECASE)
    if m:
        holder_name = m.group(1).strip()
    
    registration_number = None
    m = re.search(r"(?:reg(?:istration)?\s*no|vehicle\s*reg|vehicle\s*no)[:\s.-]+([A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,2}\s?\d{4})", full_text, re.IGNORECASE)
    if m:
        registration_number = re.sub(r"\s+", " ", m.group(1).strip())
        
    valid_from = None
    m = re.search(r"(?:valid\s*from|period\s*from|start\s*date)[:\s.-]+(\d{2}[-/]\d{2}[-/]\d{4}|\d{2}\s+[A-Za-z]{3}\s+\d{4})", full_text, re.IGNORECASE)
    if m:
        valid_from = m.group(1).strip()

    valid_until = None
    m = re.search(r"(?:valid\s*to|valid\s*until|expiry\s*date|validity)[:\s.-]+(\d{2}[-/]\d{2}[-/]\d{4}|\d{2}\s+[A-Za-z]{3}\s+\d{4})", full_text, re.IGNORECASE)
    if m:
        valid_until = m.group(1).strip()

    fields = PermitFields(
        permit_number=permit_number,
        permit_type=permit_type,
        holder_name=holder_name,
        registration_number=registration_number,
        valid_from=valid_from,
        valid_until=valid_until
    )
    logger.info(f"Permit fields extracted: {fields.model_dump()}")
    return fields

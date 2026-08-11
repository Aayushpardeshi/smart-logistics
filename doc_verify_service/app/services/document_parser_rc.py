import re
from loguru import logger
from app.ai.ocr_pipeline import extract_text
from app.schemas.document import RCFields


def parse_rc_document(file_bytes: bytes, filename: str) -> tuple[str, RCFields]:
    raw_text = extract_text(file_bytes, filename)

    if not raw_text:
        logger.warning("No text extracted from RC document")
        return "", RCFields()

    logger.info(f"RC raw text extracted:\n{raw_text}")

    rc_fields = extract_rc_fields(raw_text)
    return raw_text, rc_fields


def normalize_ocr_rc(text: str) -> str:
    """
    Fix common OCR misreads on Indian RC documents.
    """
    text = text.replace("Regn No;", "Regn No:")
    text = text.replace("Reg. No;", "Reg. No:")
    # O/0 confusion in registration numbers is handled at regex level
    return text


def find_dates_in_text(text: str) -> list[str]:
    return re.findall(r"\b(\d{2}[-/]\d{2}[-/]\d{4})\b", text)


def extract_rc_fields(text: str) -> RCFields:
    text = normalize_ocr_rc(text)
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    full_text = " ".join(lines)

    # ── Registration Number ──────────────────────────────────────
    registration_number = None

    m = re.search(
        r"(?:regn?\.?\s*no|registration\s*no|reg\.?\s*no)[:\s]+([A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,2}\s?\d{4})",
        full_text, re.IGNORECASE
    )
    if m:
        registration_number = re.sub(r"\s+", " ", m.group(1).strip())

    if not registration_number:
        m = re.search(r"\b([A-Z]{2}\d{1,2}[A-Z]{1,2}\d{4})\b", full_text)
        if m:
            registration_number = m.group(1).strip()

    # ── Owner Name ────────────────────────────────────────────────
    owner_name = None
    m = re.search(
        r"(?:owner\s*name|name\s*of\s*owner|registered\s*owner)[:\s]+([A-Z][A-Z\s]{3,40})",
        full_text, re.IGNORECASE
    )
    if m:
        raw_name = m.group(1).strip()
        owner_name = re.split(
            r"\s{2,}|S/O|D/O|W/O|Address|Chassis|Engine",
            raw_name, flags=re.IGNORECASE
        )[0].strip()

    # ── Vehicle Class ─────────────────────────────────────────────
    vehicle_class = None
    m = re.search(
        r"(?:class\s*of\s*vehicle|vehicle\s*class)[:\s]+([A-Z][A-Za-z\s\-]{3,40})",
        full_text, re.IGNORECASE
    )
    if m:
        vehicle_class = re.split(
            r"\s{2,}|Maker|Chassis|Engine|Fuel",
            m.group(1).strip(), flags=re.IGNORECASE
        )[0].strip()

    # ── Maker / Model ─────────────────────────────────────────────
    maker_model = None
    m = re.search(
        r"(?:maker'?s?\s*(?:name|/model)?|maker\s*and\s*model)[:\s]+([A-Z0-9][A-Za-z0-9\s\-]{3,50})",
        full_text, re.IGNORECASE
    )
    if m:
        maker_model = re.split(
            r"\s{2,}|Chassis|Engine|Fuel|Body",
            m.group(1).strip(), flags=re.IGNORECASE
        )[0].strip()

    # ── Chassis Number ────────────────────────────────────────────
    chassis_number = None
    m = re.search(
        r"chassis\s*(?:no|number)[:\s]+([A-Z0-9]{5,20})",
        full_text, re.IGNORECASE
    )
    if m:
        chassis_number = m.group(1).strip()

    # ── Engine Number ─────────────────────────────────────────────
    engine_number = None
    m = re.search(
        r"engine\s*(?:no|number)[:\s]+([A-Z0-9]{5,20})",
        full_text, re.IGNORECASE
    )
    if m:
        engine_number = m.group(1).strip()

    # ── Fuel Type ─────────────────────────────────────────────────
    fuel_type = None
    m = re.search(
        r"fuel\s*(?:used|type)?[:\s]+(diesel|petrol|cng|electric|lpg)",
        full_text, re.IGNORECASE
    )
    if m:
        fuel_type = m.group(1).strip().upper()

    # ── Registration Date ─────────────────────────────────────────
    registration_date = None
    m = re.search(
        r"(?:regn\.?\s*date|registration\s*date|date\s*of\s*registration)[:\s]+(\d{2}[-/]\d{2}[-/]\d{4})",
        full_text, re.IGNORECASE
    )
    if m:
        registration_date = m.group(1).strip()

    # ── Registration Valid Upto ──────────────────────────────────
    registration_valid_upto = None
    m = re.search(
        r"(?:valid\s*upto|validity|reg\.?\s*upto)[:\s]+(\d{2}[-/]\d{2}[-/]\d{4})",
        full_text, re.IGNORECASE
    )
    if m:
        registration_valid_upto = m.group(1).strip()

    # Fallback: pick 2nd date found if valid_upto missing but reg_date found
    if registration_date and not registration_valid_upto:
        all_dates = find_dates_in_text(full_text)
        if len(all_dates) >= 2:
            registration_valid_upto = all_dates[1]

    # ── Financer Name (if hypothecated) ──────────────────────────
    financer_name = None
    m = re.search(
        r"(?:financer|financier|hypothecated\s*to)[:\s]+([A-Z][A-Za-z\s&.]{3,50})",
        full_text, re.IGNORECASE
    )
    if m:
        financer_name = re.split(
            r"\s{2,}|Address|Regn|Chassis",
            m.group(1).strip(), flags=re.IGNORECASE
        )[0].strip()

    fields = RCFields(
        registration_number=registration_number,
        owner_name=owner_name,
        vehicle_class=vehicle_class,
        maker_model=maker_model,
        chassis_number=chassis_number,
        engine_number=engine_number,
        fuel_type=fuel_type,
        registration_date=registration_date,
        registration_valid_upto=registration_valid_upto,
        financer_name=financer_name,
    )

    logger.info(f"RC fields extracted: {fields.model_dump()}")
    return fields
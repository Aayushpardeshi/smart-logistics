import re
from loguru import logger
from app.ai.ocr_pipeline import extract_text
from app.schemas.document import AadhaarFrontFields


def parse_aadhaar_front(
    file_bytes: bytes, filename: str
) -> tuple[str, AadhaarFrontFields]:
    try:
        raw_text = extract_text(file_bytes, filename)
    except Exception as e:
        logger.error(f"OCR failed on Aadhaar front: {e}")
        return "", AadhaarFrontFields()

    if not raw_text:
        logger.warning("No text extracted from Aadhaar front")
        return "", AadhaarFrontFields()

    logger.info(f"Aadhaar front raw text:\n{raw_text}")

    try:
        fields = extract_aadhaar_front_fields(raw_text)
    except Exception as e:
        logger.error(f"Field extraction failed on Aadhaar front: {e}")
        return raw_text, AadhaarFrontFields()

    return raw_text, fields


def extract_aadhaar_front_fields(text: str) -> AadhaarFrontFields:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    full_text = " ".join(lines)

    # ── Aadhaar Number ────────────────────────────────────────
    aadhaar_number = None
    m = re.search(r"\b(\d{4}\s\d{4}\s\d{4})\b", full_text)
    if m:
        aadhaar_number = m.group(1).strip()

    if not aadhaar_number:
        m = re.search(r"\b(\d{12})\b", full_text)
        if m:
            raw = m.group(1)
            aadhaar_number = f"{raw[:4]} {raw[4:8]} {raw[8:]}"

    logger.info(f"Aadhaar number: {aadhaar_number}")

    # ── Name ──────────────────────────────────────────────────
    name = None
    for line in lines:
        if re.search(r"[\u0900-\u097F]", line):
            continue
        if re.search(
            r"government|india|father|year|birth|male|female|"
            r"aadhaar|uidai|www|help|address|unique|identification",
            line, re.IGNORECASE
        ):
            continue
        if re.match(r"^[A-Z][a-zA-Z\s]{4,40}$", line.strip()):
            name = line.strip()
            break

    logger.info(f"Name: {name}")

    # ── Father Name ───────────────────────────────────────────
    father_name = None
    m = re.search(
        r"(?:Father\s*[:\s]+)([A-Za-z\s]{4,60})",
        full_text, re.IGNORECASE
    )
    if m:
        raw = m.group(1).strip()
        father_name = re.split(
            r"\s{2,}|Year|Birth|Male|Female|Aadhaar|\d",
            raw, flags=re.IGNORECASE
        )[0].strip()

    logger.info(f"Father: {father_name}")

    # ── Year of Birth ─────────────────────────────────────────
    year_of_birth = None
    m = re.search(
        r"year\s+of\s+birth\s*[:\s]*(\d{4})",
        full_text, re.IGNORECASE
    )
    if m:
        year_of_birth = m.group(1).strip()

    if not year_of_birth:
        m = re.search(r"\b(19\d{2}|20\d{2})\b", full_text)
        if m:
            year_of_birth = m.group(1)

    logger.info(f"Year of birth: {year_of_birth}")

    # ── Gender ────────────────────────────────────────────────
    gender = None
    if re.search(r"\bMale\b", full_text, re.IGNORECASE):
        gender = "Male"
    elif re.search(r"\bFemale\b", full_text, re.IGNORECASE):
        gender = "Female"

    logger.info(f"Gender: {gender}")

    return AadhaarFrontFields(
        aadhaar_number=aadhaar_number,
        name=name,
        father_name=father_name,
        year_of_birth=year_of_birth,
        gender=gender,
    )
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
    m = re.search(r"\b(\d{4})[\s.-]?(\d{4})[\s.-]?(\d{4})\b", full_text)
    if m:
        aadhaar_number = f"{m.group(1)} {m.group(2)} {m.group(3)}"

    logger.info(f"Aadhaar number: {aadhaar_number}")

    # ── Name ──────────────────────────────────────────────────
    name = None

    def is_valid_name_word(w: str) -> bool:
        return w.isalpha() and len(w) >= 2 and (w.isupper() or w.istitle())

    # Find line index of "Government of India" / "Government" header
    header_idx = -1
    for idx, line in enumerate(lines):
        if re.search(r"(government|india|authority|unique|identification)", line, re.IGNORECASE):
            header_idx = idx
            break

    # Strictly search lines AFTER the "Government of India" header to exclude top OCR noise
    search_lines = lines[header_idx + 1:] if header_idx >= 0 else lines

    # Priority 1: Multi-word Name below Government of India header (e.g. Punde Supriya Santosh, Aruna Bhau Punde, PUNDE SUYOG SANTOSH)
    for line in search_lines:
        candidate = line.strip()
        if re.search(r"[\u0900-\u097F]", candidate):
            continue
        if re.search(r"(government|india|authority|unique|identification|aadhaar|help|father|mobile|dob|male|female|download|enrolment|issue|address)", candidate, re.IGNORECASE):
            continue
        words = candidate.split()
        if len(words) >= 2 and all(is_valid_name_word(w) for w in words):
            name = candidate
            break

    # Priority 2: Scan upwards from DOB / Gender line
    if not name:
        anchor_idx = -1
        for idx, line in enumerate(lines):
            if re.search(r"(dob|date\s*of\s*birth|year\s*of\s*birth|\d{2}/\d{2}/\d{4}|male|female)", line, re.IGNORECASE):
                anchor_idx = idx
                break

        if anchor_idx > 0:
            for idx in range(anchor_idx - 1, -1, -1):
                candidate = lines[idx].strip()
                if re.search(r"[\u0900-\u097F]", candidate):
                    continue
                if re.search(r"(government|india|authority|unique|identification|aadhaar|help|father|mobile|dob|male|female|download)", candidate, re.IGNORECASE):
                    continue
                words = candidate.split()
                if len(words) >= 2 and all(is_valid_name_word(w) for w in words):
                    name = candidate
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
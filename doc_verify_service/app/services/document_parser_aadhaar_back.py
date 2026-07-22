import re
from loguru import logger
from app.ai.ocr_pipeline import extract_text
from app.schemas.document import AadhaarBackFields


def parse_aadhaar_back(
    file_bytes: bytes, filename: str
) -> tuple[str, AadhaarBackFields]:
    try:
        raw_text = extract_text(file_bytes, filename)
    except Exception as e:
        logger.error(f"OCR failed on Aadhaar back: {e}")
        return "", AadhaarBackFields()

    if not raw_text:
        logger.warning("No text extracted from Aadhaar back")
        return "", AadhaarBackFields()

    logger.info(f"Aadhaar back raw text:\n{raw_text}")

    try:
        fields = extract_aadhaar_back_fields(raw_text)
    except Exception as e:
        logger.error(f"Field extraction failed on Aadhaar back: {e}")
        return raw_text, AadhaarBackFields()

    return raw_text, fields


def extract_aadhaar_back_fields(text: str) -> AadhaarBackFields:
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

    logger.info(f"Back Aadhaar number: {aadhaar_number}")

    # ── Pincode ───────────────────────────────────────────────
    pincode = None
    m = re.search(r"\b(\d{6})\b", full_text)
    if m:
        pincode = m.group(1)
    logger.info(f"Pincode: {pincode}")

    # ── Address ───────────────────────────────────────────────
    address = None

    # Strategy 1: find "Address:" label
    m = re.search(
        r"Address[.:\s]+(.+?)(?=\d{6}|help@|www\.|1800|P\.O|$)",
        full_text, re.IGNORECASE | re.DOTALL
    )
    if m:
        raw_addr = m.group(1).strip()
        raw_addr = re.sub(r"[\u0900-\u097F]+", "", raw_addr)
        raw_addr = re.sub(r"[~`|<>\[\]{}\"'\\]", " ", raw_addr)
        raw_addr = re.sub(r"\s+", " ", raw_addr).strip()
        raw_addr = raw_addr.rstrip(",").strip()
        if len(raw_addr) > 10:
            address = raw_addr

    # Strategy 2: collect English lines after "Address"
    if not address:
        english_lines = []
        collecting = False
        for line in lines:
            if re.search(r"^address", line, re.IGNORECASE):
                collecting = True
                continue
            if collecting:
                if re.search(r"[\u0900-\u097F]", line):
                    continue
                if re.search(
                    r"help@|www\.|1800|uidai|P\.O|colour|color",
                    line, re.IGNORECASE
                ):
                    break
                if re.search(r"[A-Z0-9]", line):
                    english_lines.append(line.strip())
        if english_lines:
            address = " ".join(english_lines).strip()

    logger.info(f"Address: {address}")

    return AadhaarBackFields(
        aadhaar_number=aadhaar_number,
        address=address,
        pincode=pincode,
    )
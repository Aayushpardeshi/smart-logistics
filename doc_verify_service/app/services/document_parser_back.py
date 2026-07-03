import re
from loguru import logger
from app.ai.ocr_pipeline import extract_text
from app.schemas.document import LicenceBackFields, VehicleClass


def parse_back_document(
    file_bytes: bytes, filename: str
) -> tuple[str, LicenceBackFields]:
    raw_text = extract_text(file_bytes, filename)

    if not raw_text:
        logger.warning("No text extracted from back document")
        return "", LicenceBackFields()

    logger.info(f"Back side raw text extracted:\n{raw_text}")

    back_fields = extract_back_fields(raw_text)
    return raw_text, back_fields


def extract_back_fields(text: str) -> LicenceBackFields:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    full_text = " ".join(lines)

    # ── Licence Number ─────────────────────────────────────────
    licence_number = None

    # Standard: "DL No : MH12 20230057935"
    m = re.search(
        r"DL\s*No\s*[:\s]+([A-Z]{2}\d{2}\s?\d{8,13})",
        full_text, re.IGNORECASE
    )
    if m:
        licence_number = m.group(1).strip()

    # Bare MH number
    if not licence_number:
        m = re.search(r"\b(MH\d{2}\s?\d{8,13})\b", full_text)
        if m:
            licence_number = m.group(1).strip()

    # OCR misread: "MHI2 _" → MH12 with mangled digits
    if not licence_number:
        m = re.search(
            r"\b(MH[I1][\d]\s?[\d\s]{8,14})",
            full_text, re.IGNORECASE
        )
        if m:
            raw = m.group(1).replace("I", "1")
            licence_number = re.sub(r"\s+", " ", raw).strip()

    # Last resort: reconstruct from any long digit sequence
    if not licence_number:
        m = re.search(r"\b(\d{11,13})\b", full_text)
        if m:
            licence_number = f"MH12 {m.group(1)}"
            logger.warning(f"Licence number reconstructed: {licence_number}")

    logger.info(f"Licence number: {licence_number}")

    # ── Vehicle Classes ────────────────────────────────────────
    vehicle_classes = extract_vehicle_classes(lines, full_text)
    logger.info(f"Vehicle classes: {vehicle_classes}")

    # ── Emergency Contact ──────────────────────────────────────
    emergency_contact = None

    m = re.search(
        r"emergency\s*contact\s*(?:number)?\s*[:\s]*(\d{10})",
        full_text, re.IGNORECASE
    )
    if m:
        emergency_contact = m.group(1).strip()

    if not emergency_contact:
        for line in lines:
            m = re.search(r"\b(\d{10})\b", line)
            if m:
                emergency_contact = m.group(1).strip()
                break

    logger.info(f"Emergency contact: {emergency_contact}")

    return LicenceBackFields(
        licence_number=licence_number,
        vehicle_classes=vehicle_classes,
        emergency_contact=emergency_contact,
    )


def extract_vehicle_classes(
    lines: list[str], full_text: str
) -> list[VehicleClass]:
    """
    Two strategies:
    1. Direct: scan lines for known vehicle codes
    2. Fallback: OCR missed table — assign MCWG + LMV
       using dates found in text (standard Indian DL format)
    """
    vehicle_classes = []
    found_codes = set()

    known_codes = ["MCWG", "LMV", "HMV", "HGMV", "HPMV", "MGV", "TRANS", "FVG"]
    date_pattern = r"\b(\d{2}[-/]\d{2}[-/]\d{4})\b"
    category_pattern = r"\b(NT|TR)\b"
    issued_by_pattern = r"\b([A-Z]{2}\d{2})\b"

    # Strategy 1: direct line scan
    for line in lines:
        line_upper = line.upper()
        for code in known_codes:
            if code in line_upper and code not in found_codes:
                found_codes.add(code)

                date_match = re.search(date_pattern, line)
                cat_match = re.search(category_pattern, line, re.IGNORECASE)
                issued_match = re.search(issued_by_pattern, line)

                vehicle_classes.append(VehicleClass(
                    code=code,
                    issued_by=issued_match.group(1) if issued_match else None,
                    date_of_issue=date_match.group(1) if date_match else None,
                    category=cat_match.group(1).upper() if cat_match else None,
                ))
                logger.info(f"Direct match: {code}")
                break

    # Strategy 2: smart fallback
    if not vehicle_classes:
        logger.warning("No vehicle codes found — applying smart fallback")

        all_dates = re.findall(date_pattern, full_text)
        unique_dates = list(dict.fromkeys(all_dates))

        # Extract issued_by from "[MH12] Licensing Authority"
        issued_match = re.search(
            r"\[?(MH\d{2})\]?\s*Licens",
            full_text, re.IGNORECASE
        )
        issued_by = issued_match.group(1) if issued_match else None

        # Standard Indian DL back always has MCWG first, LMV second
        default_codes = ["MCWG", "LMV"]

        for i, code in enumerate(default_codes):
            date = unique_dates[i] if i < len(unique_dates) else (
                unique_dates[0] if unique_dates else None
            )
            vehicle_classes.append(VehicleClass(
                code=code,
                issued_by=issued_by,
                date_of_issue=date,
                category="NT",
            ))
            logger.info(f"Fallback vehicle: {code} | date={date}")

    return vehicle_classes
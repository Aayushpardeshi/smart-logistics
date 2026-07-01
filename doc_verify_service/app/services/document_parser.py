import re
from loguru import logger
from app.ai.ocr_pipeline import extract_text
from app.schemas.document import ExtractedField, LicenceFields


def parse_document(
    file_bytes: bytes, filename: str
) -> tuple[str, list[ExtractedField], LicenceFields]:
    raw_text = extract_text(file_bytes, filename)

    if not raw_text:
        logger.warning("No text extracted from document")
        return "", [], LicenceFields()

    logger.info(f"Raw text extracted:\n{raw_text}")

    licence_fields = extract_licence_fields(raw_text)
    generic_fields = build_generic_fields(licence_fields)

    return raw_text, generic_fields, licence_fields


def normalize_ocr(text: str) -> str:
    """
    Fix common OCR misreads on Indian driving licences.
    """
    # O confused with 0 in blood group context
    text = re.sub(r"\bBG[:\s]+0([+\-t])", r"BG: O\1", text)
    text = re.sub(r"Blood Group[:\s]+0([+\-])", r"Blood Group: O\1", text, flags=re.IGNORECASE)

    # + misread as t after blood group letter
    text = re.sub(r"\bBG[:\s]+([ABO]{1,2})t\b", r"BG: \1+", text, flags=re.IGNORECASE)
    text = re.sub(r"Blood Group[:\s]+([ABO]{1,2})t\b", r"Blood Group: \1+", text, flags=re.IGNORECASE)

    # DL No with semicolon instead of colon
    text = text.replace("DL No;", "DL No:")

    return text


def find_dates_in_text(text: str) -> list[str]:
    """Extract all dates from text in order."""
    return re.findall(r"\b(\d{2}[-/]\d{2}[-/]\d{4})\b", text)


def extract_licence_fields(text: str) -> LicenceFields:
    """
    Handles both old and new format Indian driving licences.
    """
    text = normalize_ocr(text)
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    full_text = " ".join(lines)

    # ── Licence Number ────────────────────────────────────────────
    licence_number = None

    m = re.search(r"DL\s*No[:\s]+([A-Z]{2}\d{2}\s?\d{8,13})", full_text, re.IGNORECASE)
    if m:
        licence_number = m.group(1).strip()

    if not licence_number:
        m = re.search(r"\b(MH\d{2}\s?\d{8,13})\b", full_text)
        if m:
            licence_number = m.group(1).strip()

    if not licence_number:
        m = re.search(r"\b([A-Z]{2}\d{2}\s?\d{8,13})\b", full_text)
        if m:
            licence_number = m.group(1).strip()

    # ── Issue Date ────────────────────────────────────────────────
    issue_date = None

    # Old: "DOI : 17-01-2014"
    m = re.search(r"\bDOI\s*[:\s]+(\d{2}[-/]\d{2}[-/]\d{4})", full_text, re.IGNORECASE)
    if m:
        issue_date = m.group(1).strip()

    # New: "Issue Date" label then dates on next line
    if not issue_date:
        for i, line in enumerate(lines):
            if re.search(r"issue\s*date", line, re.IGNORECASE):
                search_text = line
                if i + 1 < len(lines):
                    search_text += " " + lines[i + 1]
                dates = find_dates_in_text(search_text)
                if dates:
                    issue_date = dates[0]
                break

    # ── Validity ──────────────────────────────────────────────────
    validity_nt = None

    # Old: "Valid Till : 14-07-2032"
    m = re.search(r"valid\s*till\s*[:\s]+(\d{2}[-/]\d{2}[-/]\d{4})", full_text, re.IGNORECASE)
    if m:
        validity_nt = m.group(1).strip()

    # New: "Validity (NT)" then dates on next line
    if not validity_nt:
        for i, line in enumerate(lines):
            if re.search(r"validity\s*\(NT\)", line, re.IGNORECASE):
                search_text = line
                if i + 1 < len(lines):
                    search_text += " " + lines[i + 1]
                dates = find_dates_in_text(search_text)
                if len(dates) >= 2:
                    validity_nt = dates[1]
                elif len(dates) == 1:
                    validity_nt = dates[0]
                break

    # Fallback: all dates in order
    if not issue_date or not validity_nt:
        all_dates = find_dates_in_text(full_text)
        logger.info(f"All dates found: {all_dates}")
        if all_dates and not issue_date:
            issue_date = all_dates[0]
        if len(all_dates) >= 2 and not validity_nt:
            validity_nt = all_dates[1]

    # ── Date of Birth ─────────────────────────────────────────────
    dob = None

    # Old: "DOB : 15-07-1972"
    m = re.search(r"\bDOB\s*[:\s]+(\d{2}[-/]\d{2}[-/]\d{4})", full_text, re.IGNORECASE)
    if m:
        dob = m.group(1).strip()

    # New: "Date of Birth: 16-02-2005"
    if not dob:
        m = re.search(
            r"date\s+of\s+birth\s*[:\s]+(\d{2}[-/]\d{2}[-/]\d{4})",
            full_text, re.IGNORECASE
        )
        if m:
            dob = m.group(1).strip()

    # ── Blood Group ───────────────────────────────────────────────
    blood_group = None

    # Old: "BG: A+" (after normalization)
    m = re.search(r"\bBG\s*[:\s]+([ABO]{1,2}[+\-])", full_text, re.IGNORECASE)
    if m:
        blood_group = m.group(1).strip()

    # New: "Blood Group: O+" (after normalization)
    if not blood_group:
        m = re.search(
            r"blood\s*group\s*[:\s]+([ABO]{1,2}[+\-])",
            full_text, re.IGNORECASE
        )
        if m:
            blood_group = m.group(1).strip()

    # Fallback: bare blood group
    if not blood_group:
        m = re.search(r"\b([ABO]{1,2}[+\-])\b", full_text)
        if m:
            blood_group = m.group(1).strip()

    # ── Name ──────────────────────────────────────────────────────
    name = None

    m = re.search(r"name\s*[:\s]+([A-Z][A-Z\s]{3,40})", full_text, re.IGNORECASE)
    if m:
        raw_name = m.group(1).strip()
        # Stop at known next-field keywords
        name = re.split(
            r"\s{2,}|Date|DOB|Blood|Son|S/D|Address|Add\b",
            raw_name, flags=re.IGNORECASE
        )[0].strip()

    # ── Father / Spouse ───────────────────────────────────────────
    father = None

    # Old: "S/DMW of : VITTHAL" — OCR mangles S/D/W
    m = re.search(
        r"S[/\\][A-Z]+[/\\]?[A-Z]*\s*of\s*[:\s]+([A-Z][A-Z\s]{2,40})",
        full_text, re.IGNORECASE
    )
    if m:
        father = m.group(1).strip().split("\n")[0]
        # Remove trailing noise words
        father = re.split(r"\s{2,}|Add|Address|PIN|Signature", father, flags=re.IGNORECASE)[0].strip()

    # New: "Son / Daughter / Wife of: YOGESH VITHAL PARDESHI"
    if not father:
        m = re.search(
            r"(?:son|daughter|wife)\s*[/\s]*(?:daughter\s*[/\s]*)?(?:wife\s*)?of\s*[:\s]+([A-Z][A-Z\s]{2,40})",
            full_text, re.IGNORECASE
        )
        if m:
            father = m.group(1).strip()
            # Remove trailing noise words like "Address"
            father = re.split(
                r"\s{2,}|Address|Add\b|PIN|Signature",
                father, flags=re.IGNORECASE
            )[0].strip()

    # ── Address ───────────────────────────────────────────────────
    address = None

    # Old: "Add :FL.NO.C-3..." stop at PIN or Signature
    m = re.search(
        r"(?:^|\n)\s*Add\s*[:\s]+(.+?)(?=PIN\s*[:\s]*\d{6}|Signature|issuing|$)",
        text, re.IGNORECASE | re.DOTALL
    )
    if m:
        raw_addr = m.group(1).strip()
        raw_addr = re.sub(r"[~`|<>\[\]{}\"'\\]", " ", raw_addr)
        address = " ".join(raw_addr.split())

    # New: lines after "Address:" label
    if not address:
        for i, line in enumerate(lines):
            if re.search(r"^address\s*[:\s]*$|^address\s*[:\s]*;", line, re.IGNORECASE):
                addr_parts = []
                for j in range(i + 1, min(i + 4, len(lines))):
                    next_line = lines[j]
                    if re.search(r"[A-Z0-9]", next_line) and not re.search(
                        r"^(ah|ee|a ee|signature|issuing)", next_line, re.IGNORECASE
                    ):
                        addr_parts.append(next_line)
                address = " ".join(addr_parts).strip() if addr_parts else None
                break

    fields = LicenceFields(
        licence_number=licence_number,
        name=name,
        date_of_birth=dob,
        issue_date=issue_date,
        validity_nt=validity_nt,
        blood_group=blood_group,
        father_or_spouse=father,
        address=address,
    )

    logger.info(f"Licence fields extracted: {fields.model_dump()}")
    return fields


def build_generic_fields(licence_fields: LicenceFields) -> list[ExtractedField]:
    mapping = {
        "licence_number": licence_fields.licence_number,
        "name": licence_fields.name,
        "date_of_birth": licence_fields.date_of_birth,
        "issue_date": licence_fields.issue_date,
        "validity_nt": licence_fields.validity_nt,
        "blood_group": licence_fields.blood_group,
        "father_or_spouse": licence_fields.father_or_spouse,
        "address": licence_fields.address,
    }
    return [
        ExtractedField(
            field_name=field_name,
            value=value,
            confidence=0.90 if value else 0.0,
        )
        for field_name, value in mapping.items()
    ]
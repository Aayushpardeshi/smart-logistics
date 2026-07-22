from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class DocumentType(str, Enum):
    DRIVING_LICENCE = "driving_licence"
    DRIVING_LICENCE_BACK = "driving_licence_back"
    DRIVING_LICENCE_COMBINED = "driving_licence_combined"
    AADHAAR = "aadhaar"
    AADHAAR_COMBINED = "aadhaar_combined"
    INVOICE = "invoice"
    INSURANCE = "insurance"
    ID_CARD = "id_card"
    UNKNOWN = "unknown"


class FraudStatus(str, Enum):
    CLEAN = "clean"
    SUSPICIOUS = "suspicious"
    FRAUDULENT = "fraudulent"


class ExtractedField(BaseModel):
    field_name: str
    value: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)


class VehicleClass(BaseModel):
    code: str
    issued_by: Optional[str] = None
    date_of_issue: Optional[str] = None
    category: Optional[str] = None


class LicenceFields(BaseModel):
    licence_number: Optional[str] = None
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    issue_date: Optional[str] = None
    validity_nt: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    father_or_spouse: Optional[str] = None


class LicenceBackFields(BaseModel):
    licence_number: Optional[str] = None
    vehicle_classes: list[VehicleClass] = []
    emergency_contact: Optional[str] = None


class CombinedLicenceResponse(BaseModel):
    document_type: DocumentType
    fraud_status: FraudStatus
    confidence_score: float = Field(ge=0.0, le=1.0)
    front: LicenceFields
    back: LicenceBackFields
    raw_text_front: Optional[str] = None
    raw_text_back: Optional[str] = None
    error: Optional[str] = None


class VerificationResponse(BaseModel):
    document_type: DocumentType
    fraud_status: FraudStatus
    confidence_score: float = Field(ge=0.0, le=1.0)
    extracted_fields: list[ExtractedField]
    licence_fields: Optional[LicenceFields] = None
    raw_text: Optional[str] = None
    error: Optional[str] = None


class LicenceBackResponse(BaseModel):
    document_type: DocumentType
    licence_back_fields: LicenceBackFields
    raw_text: Optional[str] = None
    error: Optional[str] = None


# ── Aadhaar Schemas ───────────────────────────────────────────────

class AadhaarFrontFields(BaseModel):
    aadhaar_number: Optional[str] = None
    name: Optional[str] = None
    father_name: Optional[str] = None
    year_of_birth: Optional[str] = None
    gender: Optional[str] = None


class AadhaarBackFields(BaseModel):
    address: Optional[str] = None
    pincode: Optional[str] = None
    aadhaar_number: Optional[str] = None


class AadhaarCombinedResponse(BaseModel):
    document_type: DocumentType
    fraud_status: FraudStatus
    confidence_score: float = Field(ge=0.0, le=1.0)
    front: AadhaarFrontFields
    back: AadhaarBackFields
    raw_text_front: Optional[str] = None
    raw_text_back: Optional[str] = None
    error: Optional[str] = None
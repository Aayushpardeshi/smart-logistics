from loguru import logger
from app.schemas.document import DocumentType, FraudStatus, InsuranceResponse, InsuranceFields
from app.services.document_parser_insurance import parse_insurance_document
from app.services.fraud_detector import check_fraud

def verify_insurance_document(file_bytes: bytes, filename: str) -> InsuranceResponse:
    try:
        raw_text, insurance_fields = parse_insurance_document(file_bytes, filename)
        
        confidence = 0.5
        if insurance_fields.policy_number: confidence += 0.2
        if insurance_fields.registration_number: confidence += 0.15
        if insurance_fields.valid_until: confidence += 0.15
        confidence = min(confidence, 1.0)
        
        fraud_status = check_fraud(raw_text)
        
        return InsuranceResponse(
            document_type=DocumentType.INSURANCE,
            fraud_status=fraud_status,
            confidence_score=confidence,
            insurance_fields=insurance_fields,
            raw_text=raw_text
        )
    except Exception as e:
        logger.error(f"Error in Insurance verification: {e}")
        import traceback
        traceback.print_exc()
        return InsuranceResponse(
            document_type=DocumentType.UNKNOWN,
            fraud_status=FraudStatus.SUSPICIOUS,
            confidence_score=0.0,
            insurance_fields=InsuranceFields(),
            error=str(e)
        )

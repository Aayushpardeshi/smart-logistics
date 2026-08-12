from loguru import logger
from app.schemas.document import DocumentType, FraudStatus, PermitResponse, PermitFields
from app.services.document_parser_permit import parse_permit_document
from app.services.fraud_detector import check_fraud

def verify_permit_document(file_bytes: bytes, filename: str) -> PermitResponse:
    try:
        raw_text, permit_fields = parse_permit_document(file_bytes, filename)
        
        confidence = 0.5
        if permit_fields.permit_number: confidence += 0.2
        if permit_fields.registration_number: confidence += 0.15
        if permit_fields.valid_until: confidence += 0.15
        confidence = min(confidence, 1.0)
        
        fraud_status = check_fraud(raw_text)
        
        return PermitResponse(
            document_type=DocumentType.PERMIT,
            fraud_status=fraud_status,
            confidence_score=confidence,
            permit_fields=permit_fields,
            raw_text=raw_text
        )
    except Exception as e:
        logger.error(f"Error in Permit verification: {e}")
        import traceback
        traceback.print_exc()
        return PermitResponse(
            document_type=DocumentType.UNKNOWN,
            fraud_status=FraudStatus.SUSPICIOUS,
            confidence_score=0.0,
            permit_fields=PermitFields(),
            error=str(e)
        )

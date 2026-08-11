from loguru import logger
from app.schemas.document import DocumentType, FraudStatus, PUCResponse
from app.services.document_parser_puc import parse_puc_document
from app.services.fraud_detector import check_fraud

def verify_puc_document(file_bytes: bytes, filename: str) -> PUCResponse:
    try:
        raw_text, puc_fields = parse_puc_document(file_bytes, filename)
        
        confidence = 0.5
        if puc_fields.registration_number: confidence += 0.2
        if puc_fields.valid_upto: confidence += 0.2
        if puc_fields.puc_certificate_number: confidence += 0.1
        
        fraud_status = check_fraud(raw_text)
        
        return PUCResponse(
            document_type=DocumentType.PUC,
            fraud_status=fraud_status,
            confidence_score=confidence,
            puc_fields=puc_fields,
            raw_text=raw_text
        )
    except Exception as e:
        logger.error(f"Error in PUC verification: {e}")
        import traceback
        traceback.print_exc()
        return PUCResponse(
            document_type=DocumentType.UNKNOWN,
            fraud_status=FraudStatus.SUSPICIOUS,
            confidence_score=0.0,
            puc_fields=None,
            error=str(e)
        )

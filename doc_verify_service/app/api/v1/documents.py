from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from loguru import logger
from app.schemas.document import (
    VerificationResponse,
    LicenceBackResponse,
    DocumentType,
)
from app.services.verification_service import verify_document
from app.services.verification_service_back import verify_back_document
from app.dependencies import get_allowed_extensions, get_max_file_size

router = APIRouter()


def validate_file(
    file: UploadFile,
    file_bytes: bytes,
    allowed_extensions: list[str],
    max_file_size: int,
) -> None:
    """Reusable file validation."""
    ext = file.filename.split(".")[-1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed: {allowed_extensions}",
        )
    if len(file_bytes) > max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max: {max_file_size // (1024 * 1024)}MB",
        )


@router.post("/verify", response_model=VerificationResponse)
async def verify_document_endpoint(
    file: UploadFile = File(...),
    allowed_extensions: list[str] = Depends(get_allowed_extensions),
    max_file_size: int = Depends(get_max_file_size),
):
    """
    Front side of driving licence.
    Extracts name, DOB, validity, blood group, address etc.
    """
    file_bytes = await file.read()
    validate_file(file, file_bytes, allowed_extensions, max_file_size)

    logger.info(f"Front side received: {file.filename} | {len(file_bytes)} bytes")
    return verify_document(file_bytes, file.filename)


@router.post("/verify-back", response_model=LicenceBackResponse)
async def verify_back_document_endpoint(
    file: UploadFile = File(...),
    allowed_extensions: list[str] = Depends(get_allowed_extensions),
    max_file_size: int = Depends(get_max_file_size),
):
    """
    Back side of driving licence.
    Extracts vehicle classes and emergency contact.
    """
    file_bytes = await file.read()
    validate_file(file, file_bytes, allowed_extensions, max_file_size)

    logger.info(f"Back side received: {file.filename} | {len(file_bytes)} bytes")
    return verify_back_document(file_bytes, file.filename)
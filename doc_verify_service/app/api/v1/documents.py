from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from loguru import logger
from app.schemas.document import (
    VerificationResponse,
    LicenceBackResponse,
    CombinedLicenceResponse,
    AadhaarCombinedResponse,
)
from app.services.verification_service import verify_document
from app.services.verification_service_back import verify_back_document
from app.services.verification_service_combined import verify_combined_document
from app.services.verification_service_aadhaar_combined import verify_aadhaar_combined
from app.dependencies import get_allowed_extensions, get_max_file_size
from app.schemas.document import RCResponse, PUCResponse
from app.services.verification_service_rc import verify_rc_document
from app.services.verification_service_puc import verify_puc_document

router = APIRouter()


def validate_file(
    file: UploadFile,
    file_bytes: bytes,
    allowed_extensions: list[str],
    max_file_size: int,
) -> None:
    """Reusable file validation for all endpoints."""
    ext = file.filename.split(".")[-1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. "
                   f"Allowed: {allowed_extensions}",
        )
    if len(file_bytes) > max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. "
                   f"Max: {max_file_size // (1024 * 1024)}MB",
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
    logger.info(f"Front received: {file.filename} | {len(file_bytes)} bytes")
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
    logger.info(f"Back received: {file.filename} | {len(file_bytes)} bytes")
    return verify_back_document(file_bytes, file.filename)


@router.post("/verify-combined", response_model=CombinedLicenceResponse)
async def verify_combined_endpoint(
    front_file: UploadFile = File(...),
    back_file: UploadFile = File(...),
    allowed_extensions: list[str] = Depends(get_allowed_extensions),
    max_file_size: int = Depends(get_max_file_size),
):
    """
    Front + back of driving licence in one request.
    Returns unified JSON — Spring Boot calls this.
    """
    front_bytes = await front_file.read()
    back_bytes = await back_file.read()
    validate_file(front_file, front_bytes, allowed_extensions, max_file_size)
    validate_file(back_file, back_bytes, allowed_extensions, max_file_size)
    logger.info(
        f"Combined received | "
        f"front={front_file.filename} | back={back_file.filename}"
    )
    return verify_combined_document(
        front_bytes=front_bytes,
        front_filename=front_file.filename,
        back_bytes=back_bytes,
        back_filename=back_file.filename,
    )


@router.post("/verify-aadhaar", response_model=AadhaarCombinedResponse)
async def verify_aadhaar_endpoint(
    front_file: UploadFile = File(...),
    back_file: UploadFile = File(...),
    allowed_extensions: list[str] = Depends(get_allowed_extensions),
    max_file_size: int = Depends(get_max_file_size),
):
    """
    Front + back of Aadhaar card in one request.
    Extracts name, DOB, gender, Aadhaar number, address, pincode.
    Spring Boot calls this for Aadhaar verification.
    """
    front_bytes = await front_file.read()
    back_bytes = await back_file.read()

    validate_file(front_file, front_bytes, allowed_extensions, max_file_size)
    validate_file(back_file, back_bytes, allowed_extensions, max_file_size)

    logger.info(
        f"Aadhaar received | "
        f"front={front_file.filename} | back={back_file.filename}"
    )

    return verify_aadhaar_combined(
        front_bytes=front_bytes,
        front_filename=front_file.filename,
        back_bytes=back_bytes,
        back_filename=back_file.filename,
    )

@router.post("/verify-rc", response_model=RCResponse)
async def verify_rc_endpoint(
    file: UploadFile = File(...),
    allowed_extensions: list[str] = Depends(get_allowed_extensions),
    max_file_size: int = Depends(get_max_file_size),
):
    """
    Vehicle Registration Certificate (RC).
    Extracts registration number, owner, chassis/engine no, validity etc.
    """
    file_bytes = await file.read()
    validate_file(file, file_bytes, allowed_extensions, max_file_size)
    logger.info(f"RC received: {file.filename} | {len(file_bytes)} bytes")
    return verify_rc_document(file_bytes, file.filename)

@router.post("/verify-puc", response_model=PUCResponse)
async def verify_puc_endpoint(
    file: UploadFile = File(...),
    allowed_extensions: list[str] = Depends(get_allowed_extensions),
    max_file_size: int = Depends(get_max_file_size),
):
    """
    Pollution Under Control (PUC) Certificate.
    Extracts registration number, PUC cert number, valid upto, etc.
    """
    file_bytes = await file.read()
    validate_file(file, file_bytes, allowed_extensions, max_file_size)
    logger.info(f"PUC received: {file.filename} | {len(file_bytes)} bytes")
    return verify_puc_document(file_bytes, file.filename)
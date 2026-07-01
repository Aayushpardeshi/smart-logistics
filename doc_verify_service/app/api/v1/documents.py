from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from loguru import logger
from app.schemas.document import VerificationResponse
from app.services.verification_service import verify_document
from app.dependencies import get_allowed_extensions, get_max_file_size

router = APIRouter()


@router.post("/verify", response_model=VerificationResponse)
async def verify_document_endpoint(
    file: UploadFile = File(...),
    allowed_extensions: list[str] = Depends(get_allowed_extensions),
    max_file_size: int = Depends(get_max_file_size),
):
    """
    Accepts a document file from Spring Boot.
    Runs AI pipeline and returns verification result.
    """
    # Validate file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed: {allowed_extensions}",
        )

    # Read file bytes
    file_bytes = await file.read()

    # Validate file size
    if len(file_bytes) > max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {max_file_size // (1024*1024)}MB",
        )

    logger.info(f"Received file: {file.filename} | Size: {len(file_bytes)} bytes")

    # Run verification pipeline
    result = verify_document(file_bytes, file.filename)

    return result
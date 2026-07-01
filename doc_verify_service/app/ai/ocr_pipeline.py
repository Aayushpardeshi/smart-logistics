import pytesseract
from PIL import Image
import pdfplumber
import io
from loguru import logger
from app.config import get_settings

settings = get_settings()

# Set tesseract path from config
pytesseract.pytesseract.tesseract_cmd = settings.tesseract_path


def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Extract text from image bytes using Tesseract OCR.
    """
    try:
        image = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(image)
        logger.info("Text extracted from image successfully")
        return text.strip()
    except Exception as e:
        logger.error(f"Image OCR failed: {e}")
        return ""


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from PDF bytes using pdfplumber.
    """
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        logger.info("Text extracted from PDF successfully")
        return text.strip()
    except Exception as e:
        logger.error(f"PDF OCR failed: {e}")
        return ""


def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Route to correct extractor based on file extension.
    """
    ext = filename.split(".")[-1].lower()
    logger.info(f"Extracting text from file type: {ext}")

    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ["jpg", "jpeg", "png"]:
        return extract_text_from_image(file_bytes)
    else:
        logger.warning(f"Unsupported file type: {ext}")
        return ""
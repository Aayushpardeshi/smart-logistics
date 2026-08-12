import os
import shutil
import pytesseract
from PIL import Image
import pdfplumber
import io
from loguru import logger
from app.config import get_settings

settings = get_settings()

def configure_tesseract():
    if settings.tesseract_path and os.path.exists(settings.tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_path
        return True
    
    which_path = shutil.which("tesseract")
    if which_path:
        pytesseract.pytesseract.tesseract_cmd = which_path
        return True

    possible_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
    ]
    for p in possible_paths:
        if os.path.exists(p):
            pytesseract.pytesseract.tesseract_cmd = p
            logger.info(f"Auto-detected Tesseract binary at: {p}")
            return True
            
    logger.warning("Tesseract binary not found in standard Windows paths")
    return False

configure_tesseract()


import re
from PIL import Image, ImageOps

def has_document_keywords(text: str) -> bool:
    if not text:
        return False
    if re.search(r"\d{4}[\s.-]?\d{4}[\s.-]?\d{4}", text):
        return True
    if re.search(r"[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,2}\s?\d{4}", text, re.IGNORECASE):
        return True
    if re.search(r"(government|india|aadhaar|licence|license|registration|certificate|vehicle|policy|permit)", text, re.IGNORECASE):
        return True
    return False


_easyocr_reader = None

def get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            import torch
            use_gpu = torch.cuda.is_available()
            logger.info(f"Initializing EasyOCR reader | GPU acceleration={use_gpu}")
            _easyocr_reader = easyocr.Reader(['en'], gpu=use_gpu)
        except Exception as e:
            logger.warning(f"Failed to initialize EasyOCR reader: {e}")
            return None
    return _easyocr_reader


def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Extract text strictly from image bytes with EXIF transpose & multi-angle rotation correction.
    """
    configure_tesseract()

    try:
        raw_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        raw_img = ImageOps.exif_transpose(raw_img)
    except Exception as e:
        logger.warning(f"Failed to load image for OCR: {e}")
        return ""

    best_text = ""
    angles = [0, 180, 90, 270]

    # 1. Try EasyOCR with auto-rotation
    try:
        reader = get_easyocr_reader()
        if reader is not None:
            import numpy as np
            for angle in angles:
                rotated_img = raw_img.rotate(angle, expand=True) if angle != 0 else raw_img
                results = reader.readtext(np.array(rotated_img))
                extracted = "\n".join([res[1] for res in results])
                if has_document_keywords(extracted):
                    logger.info(f"EasyOCR text extracted successfully at rotation angle {angle}°")
                    return extracted.strip()
                if len(extracted.strip()) > len(best_text):
                    best_text = extracted.strip()
    except Exception as e:
        logger.warning(f"EasyOCR extraction failed: {e}")

    # 2. Try PyTesseract with auto-rotation if EasyOCR didn't find keywords
    try:
        for angle in angles:
            rotated_img = raw_img.rotate(angle, expand=True) if angle != 0 else raw_img
            text = pytesseract.image_to_string(rotated_img)
            if has_document_keywords(text):
                logger.info(f"Tesseract text extracted successfully at rotation angle {angle}°")
                return text.strip()
            if len(text.strip()) > len(best_text):
                best_text = text.strip()
    except Exception as e:
        logger.warning(f"Tesseract OCR image extraction failed: {e}")

    if not best_text:
        logger.warning("No OCR text could be extracted from image at any orientation")

    return best_text


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
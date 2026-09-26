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
    # the above if block is o check whether the path is specified in the .env file or not and if specified then 
    # check whether it exist in the system if it return true its over other wise it used shutil
    
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

    #here there are three try to get the tessearct path 
    logger.warning("Tesseract binary not found in standard Windows paths")
    return False

configure_tesseract()


import re
# regex 
from PIL import Image, ImageOps

def has_document_keywords(text: str) -> bool:
    if not text:
        return False
    # checks if there is no text 
    if re.search(r"\d{4}[\s.-]?\d{4}[\s.-]?\d{4}", text):
        return True
    # This searches for something like: 1234 5678 9012 or 1234-5678-9012 or 123456789012
    if re.search(r"[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,2}\s?\d{4}", text, re.IGNORECASE):
        return True
    # this looks for MH 12 AB 1234 something like this 
    if re.search(r"(government|india|aadhaar|licence|license|registration|certificate|vehicle|policy|permit)", text, re.IGNORECASE):
        return True
    # then Government India Aadhaar License Registration Certificate Vehicle Policy Permit
    return False


def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Extract text strictly from image bytes with EXIF transpose & multi-angle rotation correction.
    """
    configure_tesseract()

    try:
        # Convert bytes into an image as the recieved file is in the bytes but the pillow needs to deal with the image 
        # it converts it into the image 
        raw_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        # BytesIO lets Python treat bytes like a file, but without creating a physical file on disk 
        # and then convert it into RGB 
        raw_img = ImageOps.exif_transpose(raw_img)
    except Exception as e:
        logger.warning(f"Failed to load image for OCR: {e}")
        return ""

    best_text = ""
    angles = [0, 180, 90, 270]
    # This means we're going to try the image in four orientations.
    # Try PyTesseract with auto-rotation if EasyOCR didn't find keywords
    try:
        for angle in angles:
            # this is very good for optimization and getting accurate text 
            rotated_img = raw_img.rotate(angle, expand=True) if angle != 0 else raw_img
            # When you rotate an image, the original dimensions might not be enough to contain the entire rotated image. thats why expand true
            text = pytesseract.image_to_string(rotated_img)
            # pytesseract.image_to_string() sends the processed image to the Tesseract OCR engine and returns the recognized text as a string
            if has_document_keywords(text):
                logger.info(f"Tesseract text extracted successfully at rotation angle {angle}°")
                return text.strip()
                # strip() removes unnecessary whitespace from the beginning and end
            if len(text.strip()) > len(best_text):
                best_text = text.strip()
    except Exception as e:
        logger.warning(f"Tesseract OCR image extraction failed: {e}")

    if not best_text:
        logger.warning("No OCR text could be extracted from image at any orientation")

    return best_text

# function to extract from the pdf 
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from PDF bytes using pdfplumber.
    """
    try:
        text = ""
        # conver the bytes into pdf 
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                # go to all the pages and extract text and then append it to the text 
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        logger.info("Text extracted from PDF successfully")
        return text.strip()
    except Exception as e:
        logger.error(f"PDF OCR failed: {e}")
        return ""

# okay so basically this is like extract text based on file type means actually this function takes the filesbytes and name so from name it get to know the extention
# and from extention it knows which function to call like normal pdf reader or image extractor OCR pytesseract 

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
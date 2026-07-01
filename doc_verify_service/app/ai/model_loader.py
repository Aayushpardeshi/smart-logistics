from loguru import logger


def get_classifier_model():
    """
    Classifier is now keyword-based.
    No ML model needed — returns None intentionally.
    Kept for future ML model integration.
    """
    logger.info("Using keyword-based classifier — no model loading required")
    return None


def get_ocr_engine():
    """
    Load and cache EasyOCR as fallback if Tesseract fails.
    """
    try:
        import easyocr
        logger.info("Loading EasyOCR engine...")
        reader = easyocr.Reader(['en'], gpu=False)
        logger.info("EasyOCR loaded successfully")
        return reader
    except Exception as e:
        logger.error(f"Failed to load EasyOCR: {e}")
        return None
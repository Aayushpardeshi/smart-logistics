from functools import lru_cache # lru_cache is used to cache the most frequent and not changing function 
from loguru import logger
from app.config import Settings, get_settings # from config i just got the class and the function here 

def get_settings_dep() -> Settings:   # so this is like function to get the settings from config.py class Settings
    return get_settings()

@lru_cache()
def get_tesseract_path() -> str:  # function to get the tesseract path 
    settings = get_settings()
    logger.info(f"Tesseract path: {settings.tesseract_path}") # logger is used to print in console or swagger 
    return settings.tesseract_path

@lru_cache()
def get_allowed_extensions() -> list[str]:
    settings = get_settings()
    return [
        extension.strip().lower()
        for extension in settings.allowed_extensions.split(",")
        if extension.strip()
    ]

@lru_cache()
def get_max_file_size() -> int:
    settings = get_settings()
    return settings.max_file_size_mb * 1024 * 1024
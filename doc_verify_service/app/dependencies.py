from functools import lru_cache

from loguru import logger

from app.config import Settings, get_settings


def get_settings_dep() -> Settings:
    return get_settings()


@lru_cache()
def get_tesseract_path() -> str:
    settings = get_settings()

    logger.info(f"Tesseract path: {settings.tesseract_path}")

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
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    app_name: str = Field(default="doc_verify_service")
    app_env: str = Field(default="development")
    app_port: int = Field(default=8000)
    debug: bool = Field(default=False)

    # Logging
    log_level: str = Field(default="INFO")

    # AI Model
    model_name: str = Field(default="bert-base-uncased")
    model_path: str = Field(default="./models")

    # OCR
    tesseract_path: str = Field(
        default="/usr/bin/tesseract"
    )

    # File Upload
    max_file_size_mb: int = Field(default=10)
    allowed_extensions: str = Field(default="pdf,jpg,jpeg,png")

    # CORS
    cors_origins: str = Field(default="http://localhost:5173")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
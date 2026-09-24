from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# so this is basically imports to create the setting class so that there is no need to 
# hardocde the common fields or olways use os.getdotenv() just use this class 
# it auto reads the from .env 

class Settings(BaseSettings):
    # field is like fall back value if the .env does not sets 
    app_name: str = Field(default="doc_verify_service") 
    app_env: str = Field(default="development")
    app_port: int = Field(default=8000)
    debug: bool = Field(default=False)
    log_level: str = Field(default="INFO")
    model_name: str = Field(default="bert-base-uncased")
    model_path: str = Field(default="./models")
    tesseract_path: str = Field(default="/usr/bin/tesseract")
    max_file_size_mb: int = Field(default=10)
    allowed_extensions: str = Field(default="pdf,jpg,jpeg,png") # allowed types 
    cors_origins: str = Field(default="http://localhost:5173") # his specifies which frontend origins are allowed to make browser requests to our backend 
    model_config = SettingsConfigDict(env_file=".env",extra="ignore",case_sensitive=False,) # this tells from where to read and some extra

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]
        # so the @property is feature of python class  through which method can behave as attribute so cors_origin only return string but 
        #here the cors_origins_list return list by converting the string 

@lru_cache()
def get_settings() -> Settings:
    return Settings()
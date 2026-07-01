from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.config import get_settings
from app.api.v1.documents import router as documents_router
from loguru import logger

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} in {settings.app_env} mode")
    yield
    logger.info(f"Shutting down {settings.app_name}")


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

app.include_router(
    documents_router,
    prefix="/api/v1/documents",
    tags=["documents"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
    }                           
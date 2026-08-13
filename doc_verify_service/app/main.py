from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.v1.documents import router as documents_router
from app.config import get_settings
from app.core.error_handlers import register_error_handlers

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        f"Starting {settings.app_name} in {settings.app_env} mode"
    )

    yield

    logger.info(
        f"Shutting down {settings.app_name}"
    )


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


register_error_handlers(app)


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
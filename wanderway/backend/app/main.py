"""WanderWay API - Main Application Entry Point."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.core.limiter import limiter, rate_limit_exceeded_handler
from app.core.cache import cache_service
from app.core.gemini import GeminiServiceError
from app.api.routes import trips, stream, health, chat

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    # Initialize Redis cache on startup
    cache_service.init_app(get_settings().redis_url)
    logger.info("Application startup complete. Redis initialized.")
    yield
    # Close Redis connection pool on shutdown
    await cache_service.close()
    logger.info("Application shutdown complete. Redis connection closed.")


app = FastAPI(
    title="WanderWay API",
    version="2.0.0",
    docs_url="/docs",
    lifespan=lifespan
)

# SlowAPI configuration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Global HTTP exception handler with logging."""
    logger.warning(
        f"HTTP {exc.status_code} on {request.url.path}",
        extra={"status_code": exc.status_code, "path": str(request.url)}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "HTTPError", "detail": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(GeminiServiceError)
async def gemini_service_error_handler(request: Request, exc: GeminiServiceError):
    """Handle Gemini service errors globally."""
    logger.error(f"Gemini service error: {exc}")
    return JSONResponse(
        status_code=503,
        content={"error": "ServiceUnavailable", "detail": "Itinerary service temporarily unavailable", "status_code": 503}
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors - prevents leaking stack traces."""
    logger.exception(f"Unhandled exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "InternalServerError", "detail": "An unexpected error occurred", "status_code": 500}
    )


# Include routers
app.include_router(trips.router, prefix="/api/v1/trips", tags=["Trips"])
app.include_router(stream.router, prefix="/api/v1/stream", tags=["Stream"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(health.router, prefix="/health", tags=["Health"])


@app.get("/", tags=["Root"])
async def root():
    return {"service": "WanderWay API", "version": "2.0.0", "status": "ok"}

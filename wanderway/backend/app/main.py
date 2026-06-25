from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.core.limiter import limiter, rate_limit_exceeded_handler
from app.core.cache import cache_service
from app.api.routes import trips, stream, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Redis cache on startup
    cache_service.init_app(get_settings().redis_url)
    yield
    # Close Redis connection pool on shutdown
    await cache_service.close()

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

# Include routers
app.include_router(trips.router, prefix="/api/v1/trips", tags=["Trips"])
app.include_router(stream.router, prefix="/api/v1/stream", tags=["Stream"])
app.include_router(health.router, prefix="/health", tags=["Health"])

@app.get("/", tags=["Root"])
async def root():
    return {"service": "WanderWay API", "version": "2.0.0", "status": "ok"}

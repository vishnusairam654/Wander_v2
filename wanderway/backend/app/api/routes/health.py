"""Health check API endpoints."""
from datetime import datetime
from fastapi import APIRouter
from app.core.cache import cache_service

router = APIRouter()

@router.get("/")
async def health_check():
    try:
        redis_status = await cache_service.health_check()
    except Exception:
        redis_status = False
        
    return {
        "status": "ok" if redis_status else "degraded",
        "redis": redis_status,
        "timestamp": datetime.utcnow()
    }

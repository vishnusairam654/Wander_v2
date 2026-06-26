"""Health check API endpoints."""
import logging
from datetime import datetime
from fastapi import APIRouter, status
from app.core.cache import cache_service
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def health_check():
    """Comprehensive health check for all backend dependencies."""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Check Redis
    try:
        redis_status = await cache_service.health_check()
        health_status["checks"]["redis"] = "healthy" if redis_status else "unhealthy"
        if not redis_status:
            health_status["status"] = "degraded"
    except Exception as e:
        logger.warning(f"Redis health check failed: {e}")
        health_status["checks"]["redis"] = "unhealthy"
        health_status["status"] = "degraded"
    
    # Check Gemini API Configuration
    try:
        settings = get_settings()
        if settings.gemini_api_key and len(settings.gemini_api_key) >= 10:
            health_status["checks"]["gemini_config"] = "configured"
        else:
            health_status["checks"]["gemini_config"] = "not_configured"
            health_status["status"] = "degraded"
    except Exception as e:
        logger.warning(f"Gemini config check failed: {e}")
        health_status["checks"]["gemini_config"] = "error"
        health_status["status"] = "degraded"
    
    # Add status code based on overall health
    if health_status["status"] == "healthy":
        health_status["status_code"] = status.HTTP_200_OK
    else:
        health_status["status_code"] = status.HTTP_503_SERVICE_UNAVAILABLE
    
    return health_status

"""Dependency injection for FastAPI application."""
from app.core.cache import cache_service, CacheService
from app.core.gemini import GeminiService
from app.services.planner import PlannerService

# Singleton instances to avoid recreating on every request
_gemini_service = GeminiService()
_planner_service = PlannerService()


def get_cache() -> CacheService:
    """Return the shared cache service instance."""
    return cache_service


def get_gemini() -> GeminiService:
    """Return the singleton Gemini service instance."""
    return _gemini_service


def get_planner() -> PlannerService:
    """Return the singleton Planner service instance."""
    return _planner_service

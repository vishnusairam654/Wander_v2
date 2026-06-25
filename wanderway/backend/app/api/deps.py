from app.core.cache import cache_service, CacheService
from app.core.gemini import GeminiService
from app.services.planner import PlannerService

def get_cache() -> CacheService:
    return cache_service

def get_gemini() -> GeminiService:
    return GeminiService()

def get_planner() -> PlannerService:
    return PlannerService()

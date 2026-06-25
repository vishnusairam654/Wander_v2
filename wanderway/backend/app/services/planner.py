"""Business logic for trip planning."""
import uuid
from app.models.trip import TripRequest, TripResponse
from app.core.cache import CacheService
from app.core.gemini import GeminiService

class PlannerService:
    async def plan_trip(self, request: TripRequest, cache: CacheService, ttl: int, gemini: GeminiService) -> TripResponse:
        key = cache.make_cache_key(request)
        cached = await cache.get_cached_trip(key)
        if cached:
            return cached
            
        response = await gemini.plan_trip(request)
        
        if not response.id:
            response.id = str(uuid.uuid4())
            
        await cache.cache_trip(key, response, ttl)
        await cache.set_trip_id_mapping(response.id, key, ttl)
        
        return response

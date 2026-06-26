"""Business logic for trip planning."""
import asyncio
import uuid
import logging
from fastapi import HTTPException
from app.models.trip import TripRequest, TripResponse
from app.core.cache import CacheService
from app.core.gemini import GeminiService

logger = logging.getLogger(__name__)


class PlannerService:
    async def plan_trip(
        self,
        request: TripRequest,
        cache: CacheService,
        ttl: int,
        gemini: GeminiService
    ) -> TripResponse:
        key = cache.make_cache_key(request)
        
        # 1. Try cache first
        cached = await cache.get_cached_trip(key)
        if cached:
            logger.info(f"Cache hit for trip: {key[:16]}...")
            return cached

        # 2. Acquire distributed lock to prevent cache stampede
        lock_key = f"lock:{key}"
        lock = None
        lock_acquired = False
        
        if cache.redis:
            try:
                lock = cache.redis.lock(lock_key, timeout=30, blocking=False)
                lock_acquired = await lock.acquire()
                
                if not lock_acquired:
                    # Another request is generating this trip, wait briefly
                    logger.info(f"Waiting for concurrent request to complete: {key[:16]}...")
                    await asyncio.sleep(1)
                    cached = await cache.get_cached_trip(key)
                    if cached:
                        return cached
                    raise HTTPException(
                        status_code=503,
                        detail="Trip generation in progress. Please retry in a few seconds."
                    )
            except Exception as e:
                logger.warning(f"Lock acquisition failed, proceeding without lock: {e}")
                lock_acquired = False

        try:
            # 3. Double-check cache (another request might have populated it)
            cached = await cache.get_cached_trip(key)
            if cached:
                return cached

            # 4. Generate trip via Gemini
            logger.info(f"Generating new trip for: {request.destination}")
            response = await gemini.plan_trip(request)
            
            # 5. Assign ID if not present
            if not response.id:
                response.id = str(uuid.uuid4())
            
            # 6. Cache the response
            await cache.cache_trip(key, response, ttl)
            await cache.set_trip_id_mapping(response.id, key, ttl)
            
            logger.info(f"Trip generated and cached: {response.id}")
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.exception(f"Trip planning failed: {e}")
            raise HTTPException(
                status_code=502,
                detail="Failed to generate trip itinerary. Please try again."
            ) from e
        finally:
            # 7. Release lock
            if lock and lock_acquired:
                try:
                    await lock.release()
                except Exception as e:
                    logger.warning(f"Failed to release lock: {e}")

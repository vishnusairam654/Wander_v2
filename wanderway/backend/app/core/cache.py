"""Caching utilities and configuration."""

import json
import logging
import hashlib
from typing import Optional
import redis.asyncio as aioredis
from redis.exceptions import RedisError

from app.models.trip import TripRequest, TripResponse

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None

    def init_app(self, redis_url: str):
        """Initialize the Redis connection."""
        try:
            self.redis = aioredis.from_url(redis_url, decode_responses=True)
            logger.info("Redis cache initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Redis: {e}")
            self.redis = None

    async def close(self):
        """Close the Redis connection."""
        if self.redis:
            await self.redis.close()

    async def get_cached_trip(self, key: str) -> Optional[TripResponse]:
        """Retrieve and deserialize a trip from the cache."""
        if not self.redis:
            return None
            
        try:
            cached_data = await self.redis.get(key)
            if cached_data:
                return TripResponse.model_validate_json(cached_data)
        except RedisError as e:
            logger.warning(f"Redis connection error on get_cached_trip for key {key}: {e}")
        except Exception as e:
            logger.warning(f"Error deserializing cache data for key {key}: {e}")
            
        return None

    async def cache_trip(self, key: str, trip: TripResponse, ttl: int) -> None:
        """Serialize and store a trip in the cache."""
        if not self.redis:
            return
            
        try:
            serialized_data = trip.model_dump_json()
            await self.redis.set(key, serialized_data, ex=ttl)
        except RedisError as e:
            logger.warning(f"Redis connection error on cache_trip for key {key}: {e}")
        except Exception as e:
            logger.warning(f"Error serializing trip for cache key {key}: {e}")

    def make_cache_key(self, req: TripRequest) -> str:
        """Create a cache key based on the SHA-256 hash of the sorted model_dump_json."""
        try:
            # model_dump(mode='json') ensures types like datetime are converted to JSON primitives
            req_dict = req.model_dump(mode='json')
            req_json = json.dumps(req_dict, sort_keys=True)
            return hashlib.sha256(req_json.encode('utf-8')).hexdigest()
        except Exception as e:
            logger.error(f"Error generating cache key: {e}")
            return "default_error_key"

    async def set_trip_id_mapping(self, trip_id: str, cache_key: str, ttl: int) -> None:
        """Map trip_id -> cache_key for retrieval by ID."""
        if not self.redis:
            return
        try:
            await self.redis.set(f"trip_id:{trip_id}", cache_key, ex=ttl)
        except RedisError as e:
            logger.warning(f"Failed to set trip_id mapping: {e}")

    async def get_cache_key_by_trip_id(self, trip_id: str) -> Optional[str]:
        """Look up cache_key from trip_id."""
        if not self.redis:
            return None
        try:
            return await self.redis.get(f"trip_id:{trip_id}")
        except RedisError as e:
            logger.warning(f"Failed to get trip_id mapping: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if Redis is available."""
        if not self.redis:
            return False
            
        try:
            return await self.redis.ping()
        except RedisError as e:
            logger.warning(f"Redis health check failed: {e}")
            return False

# Singleton redis client service
cache_service = CacheService()

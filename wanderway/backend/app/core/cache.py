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

    async def get_user_trips(self, user_id: str) -> list[dict]:
        """Retrieve the list of saved trips for a user."""
        if not self.redis:
            return []
        try:
            data = await self.redis.get(f"user_trips:{user_id}")
            return json.loads(data) if data else []
        except Exception as e:
            logger.warning(f"Error retrieving user trips for {user_id}: {e}")
            return []

    async def save_user_trip(self, user_id: str, trip_summary: dict, ttl: int = 7776000) -> None:
        """Save a trip summary to the user's history (default 90 days)."""
        if not self.redis:
            return
        try:
            trips = await self.get_user_trips(user_id)
            # Deduplicate by ID
            updated = [t for t in trips if t.get("id") != trip_summary.get("id")]
            updated.insert(0, trip_summary)
            # Limit to 20 trips
            updated = updated[:20]
            await self.redis.set(f"user_trips:{user_id}", json.dumps(updated), ex=ttl)
        except Exception as e:
            logger.warning(f"Error saving user trip for {user_id}: {e}")

    async def delete_user_trip(self, user_id: str, trip_id: str) -> None:
        """Remove a trip from the user's history."""
        if not self.redis:
            return
        try:
            trips = await self.get_user_trips(user_id)
            updated = [t for t in trips if t.get("id") != trip_id]
            await self.redis.set(f"user_trips:{user_id}", json.dumps(updated))
        except Exception as e:
            logger.warning(f"Error deleting user trip {trip_id} for {user_id}: {e}")

    async def get_chat_history(self, thread_id: str) -> list[dict]:
        """Retrieve chat history for a thread."""
        if not self.redis:
            return []
        try:
            data = await self.redis.get(f"chat:{thread_id}")
            return json.loads(data) if data else []
        except Exception as e:
            logger.warning(f"Error retrieving chat history for {thread_id}: {e}")
            return []

    async def save_chat_history(self, thread_id: str, messages: list[dict]) -> None:
        """Save chat history for a thread (keep last 30)."""
        if not self.redis:
            return
        try:
            trimmed = messages[-30:]
            await self.redis.set(f"chat:{thread_id}", json.dumps(trimmed), ex=604800) # 7 days
        except Exception as e:
            logger.warning(f"Error saving chat history for {thread_id}: {e}")

    async def clear_chat_history(self, thread_id: str) -> None:
        """Delete chat history for a thread."""
        if not self.redis:
            return
        try:
            await self.redis.delete(f"chat:{thread_id}")
        except Exception as e:
            logger.warning(f"Error clearing chat history for {thread_id}: {e}")

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

import pytest
from unittest.mock import AsyncMock
from app.core.cache import CacheService
from app.models.trip import TripRequest, TripResponse

def test_make_cache_key():
    req1 = TripRequest(destination="Paris", days=5, budget="moderate", interests=["art"])
    req2 = TripRequest(destination="Paris", days=5, budget="moderate", interests=["art"])
    req3 = TripRequest(destination="London", days=5, budget="moderate", interests=["art"])
    
    service = CacheService()
    
    # Same hash for same inputs
    assert service.make_cache_key(req1) == service.make_cache_key(req2)
    
    # Different hash for different inputs
    assert service.make_cache_key(req1) != service.make_cache_key(req3)

@pytest.mark.asyncio
async def test_cache_methods():
    service = CacheService()
    service.redis = AsyncMock()
    
    # test get_cached_trip
    mock_trip = TripResponse(id="123", plan="Paris trip")
    service.redis.get.return_value = mock_trip.model_dump_json()
    
    result = await service.get_cached_trip("test_key")
    assert result.id == "123"
    service.redis.get.assert_called_once_with("test_key")
    
    # test cache_trip
    await service.cache_trip("test_key", mock_trip, ttl=3600)
    service.redis.set.assert_called_once_with("test_key", mock_trip.model_dump_json(), ex=3600)
    
    # test health_check
    service.redis.ping.return_value = True
    health = await service.health_check()
    assert health is True
    service.redis.ping.assert_called_once()

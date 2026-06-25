import pytest
from unittest.mock import AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.trip import TripResponse

@pytest.mark.asyncio
async def test_plan_trip(mocker):
    # Mock GeminiService
    mock_response = TripResponse(id="test-123", plan="Mocked Plan")
    mocker.patch('app.api.routes.trips.GeminiService.plan_trip', return_value=mock_response)
    
    # Mock cache_service to avoid redis dependency
    mocker.patch('app.api.routes.trips.cache_service.get_cached_trip', return_value=None)
    mocker.patch('app.api.routes.trips.cache_service.cache_trip')
    mocker.patch('app.api.routes.trips.cache_service.redis', AsyncMock())
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        req_data = {
            "destination": "Paris",
            "days": 5,
            "budget": "moderate",
            "interests": ["art"]
        }
        response = await ac.post("/api/v1/trips/plan", json=req_data)
        
    assert response.status_code == 200
    assert response.json()["id"] == "test-123"
    assert response.json()["plan"] == "Mocked Plan"

@pytest.mark.asyncio
async def test_rate_limit(mocker):
    # Mock GeminiService
    mock_response = TripResponse(id="test-123", plan="Mocked Plan")
    mocker.patch('app.api.routes.trips.GeminiService.plan_trip', return_value=mock_response)
    mocker.patch('app.api.routes.trips.cache_service.get_cached_trip', return_value=None)
    mocker.patch('app.api.routes.trips.cache_service.cache_trip')
    mocker.patch('app.api.routes.trips.cache_service.redis', AsyncMock())
    
    # Need to reset limiter or ensure fresh context, but SlowAPI limits by IP.
    # In a test, all requests come from the same IP (testclient).
    # We should make 10 requests, and the 11th should return 429.
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        req_data = {
            "destination": "Paris",
            "days": 5,
            "budget": "moderate",
            "interests": ["art"]
        }
        
        # Make 10 requests
        for _ in range(10):
            response = await ac.post("/api/v1/trips/plan", json=req_data)
            assert response.status_code == 200
            
        # 11th request should be rate limited
        response = await ac.post("/api/v1/trips/plan", json=req_data)
        assert response.status_code == 429

@pytest.mark.asyncio
async def test_health_check(mocker):
    mocker.patch('app.api.routes.health.cache_service.health_check', return_value=True)
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health/")
        
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["redis"] is True

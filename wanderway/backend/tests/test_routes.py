import pytest
from unittest.mock import AsyncMock
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.models.trip import TripResponse, TripRequest

@pytest.fixture
def mock_services(mocker):
    """Mocks external services like Gemini and Redis cache."""
    mock_trip_response = TripResponse(id="test-123", destination="Paris", start_date="2024-01-01", end_date="2024-01-05", itinerary=[])
    mocker.patch('app.services.gemini.GeminiService.plan_trip', return_value=mock_trip_response)
    mocker.patch('app.core.cache.CacheService.get_cached_trip', return_value=None)
    mocker.patch('app.core.cache.CacheService.cache_trip', new_callable=AsyncMock)
    mocker.patch('app.core.cache.CacheService.health_check', return_value=True)
    return mock_trip_response

@pytest.fixture
async def client():
    """Provides an async test client for the app."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_plan_trip(client: AsyncClient, mock_services):
    req_data = TripRequest(destination="Paris", start_date="2024-01-01", end_date="2024-01-05", budget="moderate", interests=["art"])
    response = await client.post("/api/v1/trips/plan", json=req_data.model_dump())
    assert response.status_code == 200
    assert response.json()["id"] == "test-123"
    assert response.json()["destination"] == "Paris"

@pytest.mark.asyncio
async def test_rate_limit(client: AsyncClient, mock_services):
    # Need to reset limiter or ensure fresh context, but SlowAPI limits by IP.
    # In a test, all requests come from the same IP (testclient).
    # We should make 10 requests, and the 11th should return 429.
    req_data = TripRequest(destination="Paris", start_date="2024-01-01", end_date="2024-01-05", budget="moderate", interests=["art"])
    json_data = req_data.model_dump()

    # Make 10 requests which should succeed
    for _ in range(10):
        response = await client.post("/api/v1/trips/plan", json=json_data)
        assert response.status_code == 200

    # The 11th request should be rate limited
    response = await client.post("/api/v1/trips/plan", json=json_data)
    assert response.status_code == 429

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient, mock_services):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["redis"] is True

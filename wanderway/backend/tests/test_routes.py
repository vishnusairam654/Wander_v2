from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_cache, get_gemini
from app.main import app
from app.models.trip import TripResponse


@pytest.fixture
def trip_response():
    return TripResponse(
        id="test-123",
        destination="Paris",
        start_date="2026-07-01",
        end_date="2026-07-03",
        itinerary=[
            {
                "day_number": 1,
                "date": "2026-07-01",
                "theme": "Art",
                "activities": [
                    {
                        "time": "09:00",
                        "title": "Louvre",
                        "description": "Visit the museum.",
                    }
                ],
            }
        ],
    )


@pytest.fixture
def service_overrides(trip_response):
    cache = AsyncMock()
    cache.make_cache_key.return_value = "cache-key"
    cache.get_cached_trip.return_value = None

    gemini = AsyncMock()
    gemini.plan_trip.return_value = trip_response

    app.dependency_overrides[get_cache] = lambda: cache
    app.dependency_overrides[get_gemini] = lambda: gemini
    yield cache, gemini
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_plan_trip(service_overrides):
    payload = {
        "destination": "Paris",
        "start_date": "2026-07-01",
        "end_date": "2026-07-03",
        "budget": "moderate",
        "interests": ["art"],
        "number_of_people": 2,
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.post("/api/v1/trips/plan", json=payload)

    assert response.status_code == 200
    assert response.json()["id"] == "test-123"
    assert response.json()["destination"] == "Paris"


@pytest.mark.asyncio
async def test_plan_trip_rejects_invalid_dates(service_overrides):
    payload = {
        "destination": "Paris",
        "start_date": "2026-07-03",
        "end_date": "2026-07-01",
        "budget": "moderate",
        "interests": ["art"],
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.post("/api/v1/trips/plan", json=payload)

    assert response.status_code == 422

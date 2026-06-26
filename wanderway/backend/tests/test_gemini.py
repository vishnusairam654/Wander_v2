from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.core.gemini import GeminiService
from app.models.trip import TripRequest, TripResponse


@pytest.mark.asyncio
async def test_gemini_uses_structured_response_and_normalizes_request_fields():
    request = TripRequest(
        destination="Paris",
        start_date="2026-07-01",
        end_date="2026-07-03",
        budget="moderate",
        interests=["art"],
    )
    generated = TripResponse(
        id="model-generated-id",
        destination="Wrong destination",
        start_date="2020-01-01",
        end_date="2020-01-02",
        itinerary=[
            {
                "day_number": 1,
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
    generate_content = AsyncMock(return_value=SimpleNamespace(parsed=generated, text=""))
    service = GeminiService()
    service._api_key = "test-key"
    service._client = SimpleNamespace(
        aio=SimpleNamespace(
            models=SimpleNamespace(generate_content=generate_content),
        )
    )

    result = await service.plan_trip(request)

    assert result.id is None
    assert result.destination == "Paris"
    assert result.start_date == "2026-07-01"
    assert result.end_date == "2026-07-03"
    generate_content.assert_awaited_once()

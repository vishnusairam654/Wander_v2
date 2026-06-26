import pytest
from pydantic import ValidationError
from app.models.trip import TripRequest, TripResponse

def test_trip_request_validation():
    req = TripRequest(
        destination="Paris",
        start_date="2026-07-01",
        end_date="2026-07-06",
        budget="moderate",
        interests=["art"],
    )
    assert req.destination == "Paris"
    assert req.days == 5
    
    with pytest.raises(ValidationError):
        TripRequest(
            destination="Paris",
            start_date="2026-07-01",
            end_date="2026-07-06",
            budget="invalid_budget",
            interests=["art"],
        )
        
    with pytest.raises(ValidationError):
        TripRequest(
            destination="Paris",
            start_date="2026-07-01",
            end_date="2026-08-02",
            budget="moderate",
            interests=["art"],
        )
        
    with pytest.raises(ValidationError):
        TripRequest(
            destination="Paris",
            start_date="2026-07-01",
            end_date="2026-07-06",
            budget="moderate",
            interests=[],
        )

def test_trip_response_serialization():
    resp = TripResponse(
        id="123",
        destination="Paris",
        start_date="2026-07-01",
        end_date="2026-07-02",
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
    json_data = resp.model_dump_json()
    
    parsed = TripResponse.model_validate_json(json_data)
    assert parsed.id == "123"
    assert parsed.itinerary[0].activities[0].title == "Louvre"

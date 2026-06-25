import pytest
from pydantic import ValidationError
from app.models.trip import TripRequest, TripResponse

def test_trip_request_validation():
    # Valid request
    req = TripRequest(destination="Paris", days=5, budget="moderate", interests=["art"])
    assert req.destination == "Paris"
    
    # Invalid budget
    with pytest.raises(ValidationError):
        TripRequest(destination="Paris", days=5, budget="invalid_budget", interests=["art"])
        
    # Duration > 30
    with pytest.raises(ValidationError):
        TripRequest(destination="Paris", days=31, budget="moderate", interests=["art"])
        
    # Empty interests
    with pytest.raises(ValidationError):
        TripRequest(destination="Paris", days=5, budget="moderate", interests=[])

def test_trip_response_serialization():
    resp = TripResponse(id="123", plan="Enjoy Paris")
    json_data = resp.model_dump_json()
    
    # Round-trip
    parsed = TripResponse.model_validate_json(json_data)
    assert parsed.id == "123"
    assert parsed.plan == "Enjoy Paris"

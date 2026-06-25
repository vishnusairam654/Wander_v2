"""Core integration logic for Gemini API."""
from app.models.trip import TripRequest, TripResponse

class GeminiService:
    @staticmethod
    async def plan_trip(request: TripRequest) -> TripResponse:
        # Mock implementation
        return TripResponse(plan=f"Plan for {request.destination} for {request.days} days")

    @staticmethod
    async def plan_trip_stream(request: TripRequest):
        # Mock stream implementation
        yield '{"chunk": "Plan for '
        yield f'{request.destination}"'
        yield '}'

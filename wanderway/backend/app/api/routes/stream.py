"""API endpoints for streaming responses."""
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.models.trip import TripRequest
from app.core.gemini import GeminiService
from app.core.limiter import limiter
from app.config import get_settings

router = APIRouter()

@router.post("/plan")
@limiter.limit(get_settings().rate_limit)
async def plan_trip_stream(request: Request, trip_request: TripRequest):
    async def event_stream():
        try:
            async for chunk in GeminiService.plan_trip_stream(trip_request):
                yield f"data: {chunk}\n\n"
        except Exception as e:
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

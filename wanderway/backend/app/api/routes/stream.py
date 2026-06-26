"""API endpoints for streaming responses."""
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.api.deps import get_gemini
from app.config import get_settings
from app.core.gemini import GeminiService
from app.core.limiter import limiter
from app.models.trip import TripRequest

router = APIRouter()

@router.post("/plan")
@limiter.limit(get_settings().rate_limit)
async def plan_trip_stream(
    request: Request,
    trip_request: TripRequest,
    gemini: GeminiService = Depends(get_gemini),
):
    async def event_stream():
        try:
            async for chunk in gemini.plan_trip_stream(trip_request):
                yield f"data: {chunk}\n\n"
        except HTTPException as exc:
            yield f"data: {json.dumps({'error': exc.detail})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'error': 'Unexpected streaming error'})}\n\n"
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

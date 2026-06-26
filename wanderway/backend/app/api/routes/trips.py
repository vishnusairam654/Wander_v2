"""API endpoints for trip management."""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends, Header
from fastapi.responses import Response
from app.models.trip import TripRequest, TripResponse
from app.core.cache import CacheService
from app.core.gemini import GeminiService, GeminiServiceError
from app.services.pdf import PDFService
from app.services.planner import PlannerService
from app.core.limiter import limiter
from app.config import Settings, get_settings
from app.api.deps import get_cache, get_gemini, get_planner
from app.api.auth import get_current_user
from typing import List, Optional

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def list_user_trips(
    current_user: str = Depends(get_current_user),
    cache: CacheService = Depends(get_cache)
) -> List[dict]:
    """List all trips for the authenticated user."""
    return await cache.get_user_trips(current_user)


@router.post("/")
async def save_user_trip(
    request: Request,
    current_user: str = Depends(get_current_user),
    cache: CacheService = Depends(get_cache)
) -> dict:
    """Save a trip to the authenticated user's history."""
    body = await request.json()
    trip_data = body.get("tripData")
    if not trip_data:
        raise HTTPException(status_code=400, detail="tripData is required")
    
    import uuid
    trip_summary = {
        "id": trip_data.get("id", f"trip-{uuid.uuid4()}"),
        "userId": current_user,  # Use verified user ID
        "destination": trip_data.get("destination", "Unknown"),
        "duration": trip_data.get("duration", 0),
        "travelers": trip_data.get("travelers", 1),
        "totalBudget": trip_data.get("totalBudget"),
        "generatedAt": trip_data.get("generatedAt"),
        "tripData": trip_data,
    }
    
    await cache.save_user_trip(current_user, trip_summary)
    return {"trip": trip_summary, "message": "Trip saved!"}


@router.delete("/{trip_id}")
async def delete_user_trip(
    trip_id: str,
    current_user: str = Depends(get_current_user),
    cache: CacheService = Depends(get_cache)
):
    """Delete a trip from the authenticated user's history."""
    await cache.delete_user_trip(current_user, trip_id)
    return {"message": "Trip deleted"}

@router.post("/plan")
@limiter.limit(get_settings().rate_limit)
async def plan_trip(
    request: Request, 
    trip_request: TripRequest,
    settings: Settings = Depends(get_settings),
    cache: CacheService = Depends(get_cache),
    gemini: GeminiService = Depends(get_gemini),
    planner: PlannerService = Depends(get_planner)
) -> TripResponse:
    try:
        return await planner.plan_trip(trip_request, cache, settings.cache_ttl, gemini)
    except GeminiServiceError as e:
        logger = logging.getLogger(__name__)
        logger.warning(f"Gemini service error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Itinerary service temporarily unavailable. Please try again later."
        ) from e
    except HTTPException:
        raise
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.exception(f"Unexpected error in plan_trip: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while planning your trip."
        ) from e

@router.get("/{trip_id}")
async def get_trip(
    trip_id: str,
    cache: CacheService = Depends(get_cache)
) -> TripResponse:
    if not cache.redis:
        raise HTTPException(status_code=503, detail="Cache service unavailable")
        
    cache_key = await cache.get_cache_key_by_trip_id(trip_id)
    if not cache_key:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    cached_trip = await cache.get_cached_trip(cache_key)
    if not cached_trip:
        raise HTTPException(status_code=404, detail="Trip not found in cache")
        
    return cached_trip

@router.get("/{trip_id}/pdf")
async def get_trip_pdf(
    trip_id: str,
    cache: CacheService = Depends(get_cache)
):
    if not cache.redis:
        raise HTTPException(status_code=503, detail="Cache service unavailable")
        
    cache_key = await cache.get_cache_key_by_trip_id(trip_id)
    if not cache_key:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    cached_trip = await cache.get_cached_trip(cache_key)
    if not cached_trip:
        raise HTTPException(status_code=404, detail="Trip not found in cache")
        
    pdf_bytes = PDFService.generate_trip_pdf(cached_trip)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="trip_{trip_id}.pdf"'}
    )

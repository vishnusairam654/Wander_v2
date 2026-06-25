"""API endpoints for trip management."""
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import Response
from app.models.trip import TripRequest, TripResponse
from app.core.cache import CacheService
from app.core.gemini import GeminiService
from app.services.pdf import PDFService
from app.services.planner import PlannerService
from app.core.limiter import limiter
from app.config import Settings, get_settings
from app.api.deps import get_cache, get_gemini, get_planner

router = APIRouter()

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
    return await planner.plan_trip(trip_request, cache, settings.cache_ttl, gemini)

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

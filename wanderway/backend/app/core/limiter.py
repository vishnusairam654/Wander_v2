import logging
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def get_client_identifier(request: Request) -> str:
    """
    Get client identifier for rate limiting.
    Priority: 1. x-user-id header (from Clerk) 2. X-Forwarded-For 3. Remote IP
    """
    # Try to get user ID from Clerk header first
    user_id = request.headers.get("x-user-id")
    if user_id:
        return f"user:{user_id}"
    
    # Try X-Forwarded-For header (for load balancer/proxy setups)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Take the first IP in the chain (client IP)
        client_ip = forwarded_for.split(",")[0].strip()
        return f"ip:{client_ip}"
    
    # Fallback to remote address
    return f"ip:{get_remote_address()}"


# Create the limiter instance with custom key function
limiter = Limiter(key_func=get_client_identifier)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom exception handler for rate limits that matches the ErrorResponse model.
    Logs the rate limit violation for monitoring.
    """
    client_id = get_client_identifier(request)
    logger.warning(
        f"Rate limit exceeded for client: {client_id}",
        extra={"client_id": client_id, "path": request.url.path}
    )
    
    response_data = {
        "error": "RateLimitExceeded",
        "detail": "You have exceeded the allowed number of requests. Please try again later.",
        "status_code": 429
    }
    return JSONResponse(status_code=429, content=response_data)

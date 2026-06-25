from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

# Create the limiter instance
limiter = Limiter(key_func=get_remote_address)

async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom exception handler for rate limits that matches the ErrorResponse model.
    """
    response_data = {
        "error": "RateLimitExceeded",
        "detail": "You have exceeded the allowed number of requests. Please try again later.",
        "status_code": 429
    }
    return JSONResponse(status_code=429, content=response_data)

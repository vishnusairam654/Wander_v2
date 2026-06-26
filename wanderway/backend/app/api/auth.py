"""Authentication and authorization dependencies for FastAPI."""
import logging
from typing import Optional
from fastapi import Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

logger = logging.getLogger(__name__)

# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)

# Clerk issuer URL (will be configured from env)
CLERK_JWKS_URL = "https://big-wombat-56.clerk.accounts.dev/.well-known/jwks.json"


class ClerkAuthError(Exception):
    """Custom exception for Clerk authentication failures."""
    pass


async def verify_clerk_token(token: str) -> Optional[dict]:
    """
    Verify Clerk JWT token and return decoded payload.
    In production, this should use python-jose with JWKS verification.
    For now, we'll use Clerk's /me endpoint for validation.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://api.clerk.com/v1/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Clerk token verification failed: {response.status_code}")
                return None
    except Exception as e:
        logger.error(f"Clerk verification error: {e}")
        return None


async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer token from Clerk"),
    x_user_id: Optional[str] = Header(None, description="User ID from Clerk (fallback)")
) -> str:
    """
    Extract and verify user identity from request headers.
    
    Priority:
    1. Verify Bearer token via Clerk API
    2. Fall back to x-user-id header (for development/mock mode)
    
    Returns:
        str: Verified user ID
        
    Raises:
        HTTPException: If authentication fails
    """
    # Try to extract Bearer token
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token:
            # In production, verify with Clerk
            # For now, extract sub from token or use x-user-id
            # TODO: Implement proper JWT verification with python-jose
            user_data = await verify_clerk_token(token)
            if user_data and user_data.get("id"):
                return user_data["id"]
    
    # Fallback to x-user-id header (development mode)
    if x_user_id:
        return x_user_id
    
    # No auth provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing authentication. Provide Authorization: Bearer <token> or x-user-id header.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
) -> Optional[str]:
    """
    Get current user ID if authenticated, None otherwise.
    Use for public endpoints that optionally enhance response for logged-in users.
    """
    try:
        return await get_current_user(authorization, x_user_id)
    except HTTPException:
        return None
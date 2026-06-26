"""API endpoints for AI chat."""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends, Header
from app.api.deps import get_gemini, get_cache
from app.core.gemini import GeminiService
from app.core.cache import CacheService
from pydantic import BaseModel
from typing import List

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

@router.post("/")
async def chat(
    request: Request,
    x_user_id: str = Header(None),
    gemini: GeminiService = Depends(get_gemini),
    cache: CacheService = Depends(get_cache)
):
    body = await request.json()
    messages = body.get("messages", [])
    thread_id = body.get("threadId", "default")
    
    if not messages:
        raise HTTPException(status_code=400, detail="Messages are required")

    # 1. Retrieve history from cache
    history = await cache.get_chat_history(thread_id)
    
    # 2. Combine history with current messages
    # Gemini expects a specific format, but for a simple chat, 
    # we can just pass the most recent context.
    full_context = history + messages
    
    # 3. Generate response using Gemini
    # We use a simpler prompt for general chat
    try:
        # For general chat, we use generate_content without a specific schema
        response = await gemini.client.aio.models.generate_content(
            model=gemini.model,
            contents=f"You are WanderWay AI, a helpful travel assistant. Context: {full_context}\n\nUser: {messages[-1]['content']}"
        )
        answer = response.text
    except Exception as e:
        logger.exception("Chat generation failed")
        raise HTTPException(status_code=502, detail="AI service unavailable")

    # 4. Update history
    updated_messages = full_context + [
        {"role": "user", "content": messages[-1]["content"]},
        {"role": "assistant", "content": answer}
    ]
    await cache.save_chat_history(thread_id, updated_messages)

    return {"message": answer}

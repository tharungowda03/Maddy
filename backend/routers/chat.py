import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import ChatRequest
from services.provider_manager import ProviderManager
from services.title_generator import generate_title
from utils.model_registry import get_provider_by_model
from services.conversation_service import (
    get_conversation,
    get_messages,
    save_message,
    update_conversation_title,
    update_conversation_model
)

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

provider_manager = ProviderManager()


def sanitize_error(err_str: str) -> str:
    if not err_str:
        return "An unexpected error occurred."
    clean = re.sub(r'sk-[a-zA-Z0-9_\-]{8,}', 'sk-***', err_str)
    clean = re.sub(r'gsk_[a-zA-Z0-9_\-]{8,}', 'gsk_***', clean)
    clean = re.sub(r'Bearer\s+[^\s,;]+', 'Bearer ***', clean, flags=re.IGNORECASE)
    return clean


@router.post("/")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    conversation = get_conversation(
        db,
        request.conversation_id
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    model_to_use = request.model or conversation.model
    provider_to_use = request.provider or get_provider_by_model(model_to_use) or conversation.provider

    if model_to_use and (conversation.model != model_to_use or conversation.provider != provider_to_use):
        update_conversation_model(
            db=db,
            conversation_id=conversation.id,
            model=model_to_use,
            provider=provider_to_use
        )
        conversation.model = model_to_use
        conversation.provider = provider_to_use

    if conversation.title == "New Chat":
        title = generate_title(request.prompt)
        update_conversation_title(
            db,
            conversation.id,
            title
        )

    save_message(
        db=db,
        conversation_id=request.conversation_id,
        role="user",
        content=request.prompt
    )

    messages = get_messages(
        db=db,
        conversation_id=request.conversation_id
    )

    try:
        provider = provider_manager.get_provider(
            model=model_to_use,
            provider_name=provider_to_use
        )
        response = provider.generate_response(
            messages,
            model_to_use
        )

    except Exception as e:
        safe_message = sanitize_error(str(e))
        raise HTTPException(
            status_code=503,
            detail=safe_message
        )

    save_message(
        db=db,
        conversation_id=request.conversation_id,
        role="assistant",
        content=response
    )

    return {
        "success": True,
        "response": response,
        "provider": provider_to_use,
        "model": model_to_use
    }

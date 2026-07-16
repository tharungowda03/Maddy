from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import ChatRequest
from services.provider_manager import ProviderManager
from services.title_generator import generate_title
from services.conversation_service import (
    get_conversation,
    get_messages,
    save_message,
    update_conversation_title
)

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

provider_manager = ProviderManager()


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
            conversation.model
        )
        response = provider.generate_response(
            messages,
            conversation.model
        )

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=str(e)
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
        "provider": conversation.provider,
        "model": conversation.model
    }

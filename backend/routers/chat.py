from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import ChatRequest
from services.provider_manager import ProviderManager
from services.conversation_service import (
    get_messages,
    save_message
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

    # Save user's prompt
    save_message(
        db=db,
        conversation_id=request.conversation_id,
        role="user",
        content=request.prompt
    )

    # Load full conversation
    messages = get_messages(
        db=db,
        conversation_id=request.conversation_id
    )

    # Get provider
    provider = provider_manager.get_provider(
        request.provider
    )

    # Generate AI response
    response = provider.generate_response(
        messages,
        request.model
    )

    # Save AI response
    save_message(
        db=db,
        conversation_id=request.conversation_id,
        role="assistant",
        content=response
    )

    return {
        "response": response
    }
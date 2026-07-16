from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import ConversationCreate, ConversationRename
from services.conversation_service import (
    create_conversation,
    get_conversations,
    rename_conversation,
    delete_conversation
)

router = APIRouter(
    prefix="/conversation",
    tags=["Conversations"]
)


@router.post("/")
def new_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db)
):
    created = create_conversation(db, conversation)
    if not created:
        raise HTTPException(status_code=404, detail="User not found")
    return created


@router.get("/user/{user_id}")
def get_user_conversations(
    user_id: int,
    db: Session = Depends(get_db)
):
    return get_conversations(db, user_id)


@router.put("/{conversation_id}")
def update_conversation(
    conversation_id: int,
    data: ConversationRename,
    db: Session = Depends(get_db)
):
    conversation = rename_conversation(
        db,
        conversation_id,
        data.title
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    return conversation


@router.delete("/{conversation_id}")
def remove_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    conversation = delete_conversation(
        db,
        conversation_id
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    return {
        "message": "Conversation deleted successfully"
    }

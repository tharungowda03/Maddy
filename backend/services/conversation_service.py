from sqlalchemy.orm import Session
from datetime import datetime

from models import Conversation, Message, User
from schemas import ConversationCreate


def create_conversation(
    db: Session,
    conversation: ConversationCreate
):
    if not db.query(User.id).filter(User.id == conversation.user_id).first():
        return None

    new_conversation = Conversation(
        user_id=conversation.user_id,
        provider=conversation.provider,
        model=conversation.model,
        title="New Chat"
    )

    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)

    return new_conversation


def get_conversations(
    db: Session,
    user_id: int
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    return [
        {
            "id": conversation.id,
            "user_id": conversation.user_id,
            "title": conversation.title,
            "provider": conversation.provider,
            "model": conversation.model,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
            "messages": get_messages(db, conversation.id),
        }
        for conversation in conversations
    ]


def rename_conversation(
    db: Session,
    conversation_id: int,
    title: str
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if conversation:
        conversation.title = title
        db.commit()
        db.refresh(conversation)

    return conversation


def delete_conversation(
    db: Session,
    conversation_id: int
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if conversation:
        db.delete(conversation)
        db.commit()

    return conversation


def save_message(
    db: Session,
    conversation_id: int,
    role: str,
    content: str
):
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content
    )

    db.add(message)
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(message)

    return message


def get_messages(
    db: Session,
    conversation_id: int
):
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return [
        {
            "role": message.role,
            "content": message.content
        }
        for message in messages
    ]


def get_conversation(
    db: Session,
    conversation_id: int
):
    return (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id
        )
        .first()
    )


def update_conversation_title(
    db: Session,
    conversation_id: int,
    title: str
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if conversation:
        conversation.title = title
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conversation)

    return conversation


def update_conversation_model(
    db: Session,
    conversation_id: int,
    model: str,
    provider: str = None
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if conversation:
        conversation.model = model
        if provider:
            conversation.provider = provider
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conversation)

    return conversation


def update_conversation(
    db: Session,
    conversation_id: int,
    title: str = None,
    model: str = None,
    provider: str = None
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if conversation:
        if title is not None:
            conversation.title = title
        if model is not None:
            conversation.model = model
        if provider is not None:
            conversation.provider = provider
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conversation)

    return conversation

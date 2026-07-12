from sqlalchemy.orm import Session

from models import Conversation, Message
from schemas import ConversationCreate



def create_conversation(
    db: Session,
    conversation: ConversationCreate
):
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
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


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
        db.commit()
        db.refresh(conversation)

    return conversation

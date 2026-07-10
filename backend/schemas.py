from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ---------- User ----------

class UserCreate(BaseModel):
    name: str
    email: EmailStr


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Conversation ----------

class ConversationCreate(BaseModel):
    provider: str
    model: str


class ConversationUpdate(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: int
    title: str
    provider: str
    model: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Message ----------

class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    image_path: Optional[str] = None


class ChatRequest(BaseModel):
    conversation_id: int
    provider: str
    model: str
    message: str


class ChatResponse(BaseModel):
    response: str
    provider: str
    model: str
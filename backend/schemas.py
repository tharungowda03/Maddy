from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr



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



class ConversationCreate(BaseModel):
    user_id: int
    provider: str
    model: str


class ConversationRename(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    provider: str
    model: str
    created_at: datetime

    class Config:
        from_attributes = True



class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    image_path: Optional[str] = None



class ChatRequest(BaseModel):
    conversation_id: int
    prompt: str


class ChatResponse(BaseModel):
    response: str
    provider: str
    model: str

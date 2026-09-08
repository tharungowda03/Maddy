from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    user_id: int
    provider: str = Field(..., max_length=50)
    model: str = Field(..., max_length=100)


class ConversationRename(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    provider: Optional[str] = Field(None, max_length=50)
    model: Optional[str] = Field(None, max_length=100)


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
    content: str = Field(..., min_length=1)
    image_path: Optional[str] = None


class ChatRequest(BaseModel):
    conversation_id: int
    prompt: str = Field(..., min_length=1, max_length=30000)
    model: Optional[str] = Field(None, max_length=100)
    provider: Optional[str] = Field(None, max_length=50)


class ChatResponse(BaseModel):
    response: str
    provider: str
    model: str

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from .models import PriorityEnum, StatusEnum

# --- Schemas de Usuario ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Schemas de Tarea ---
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: PriorityEnum = PriorityEnum.medium

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    status: Optional[StatusEnum] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    priority: PriorityEnum
    status: StatusEnum
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Token JWT ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
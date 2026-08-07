from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.token import Token


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None
    created_at: datetime


class RegisterResponse(BaseModel):
    user: UserRead
    token: Token

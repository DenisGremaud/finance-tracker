from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.schemas.token import Token


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        if not any(c.isalpha() for c in value):
            raise ValueError("Le mot de passe doit contenir au moins une lettre")
        if not any(c.isdigit() for c in value):
            raise ValueError("Le mot de passe doit contenir au moins un chiffre")
        return value


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None
    created_at: datetime


class RegisterResponse(BaseModel):
    user: UserRead
    token: Token

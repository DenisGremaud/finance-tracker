from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.schemas.token import Token


def _check_password_strength(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
    if not any(c.isalpha() for c in value):
        raise ValueError("Le mot de passe doit contenir au moins une lettre")
    if not any(c.isdigit() for c in value):
        raise ValueError("Le mot de passe doit contenir au moins un chiffre")
    return value


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        return _check_password_strength(value)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        return _check_password_strength(value)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        return _check_password_strength(value)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None
    created_at: datetime


class RegisterResponse(BaseModel):
    user: UserRead
    token: Token

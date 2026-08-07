import hashlib
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_PURPOSE = "access"
RESET_PURPOSE = "password_reset"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def password_fingerprint(hashed_password: str) -> str:
    """
    Short digest of the stored hash. Embedding it in a reset token makes that
    token single-use: once the password changes the hash changes, so the token
    no longer matches — without needing to persist anything.
    """
    return hashlib.sha256(hashed_password.encode()).hexdigest()[:16]


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = {"sub": subject, "exp": expire, "purpose": ACCESS_PURPOSE}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None

    # Tokens minted for another purpose (password reset) must never open a
    # session. Tokens issued before the claim existed are treated as access.
    if payload.get("purpose", ACCESS_PURPOSE) != ACCESS_PURPOSE:
        return None

    return payload.get("sub")


def create_password_reset_token(user_id: int, hashed_password: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.reset_token_expire_minutes)
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "purpose": RESET_PURPOSE,
        "fp": password_fingerprint(hashed_password),
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_password_reset_token(token: str) -> tuple[int, str] | None:
    """Returns (user_id, password fingerprint) when the token is a valid, unexpired reset token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None

    if payload.get("purpose") != RESET_PURPOSE:
        return None

    subject = payload.get("sub")
    fingerprint = payload.get("fp")
    if not subject or not fingerprint:
        return None

    try:
        return int(subject), fingerprint
    except ValueError:
        return None

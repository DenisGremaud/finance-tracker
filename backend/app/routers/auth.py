from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.rate_limit import limiter
from app.schemas.token import Token
from app.config import settings
from app.email import send_email
from app.schemas.user import (
    ForgotPasswordRequest,
    PasswordChange,
    RegisterResponse,
    ResetPasswordRequest,
    UserCreate,
    UserRead,
    UserUpdate,
)
from app.security import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    hash_password,
    password_fingerprint,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)) -> RegisterResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return RegisterResponse(user=UserRead.model_validate(user), token=Token(access_token=token))


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=str(user.id))
    return Token(access_token=token)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
def update_current_user(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    if payload.email is not None and payload.email != current_user.email:
        taken = (
            db.query(User)
            .filter(User.email == payload.email, User.id != current_user.id)
            .first()
        )
        if taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cet email est déjà utilisé",
            )
        current_user.email = payload.email

    if payload.full_name is not None:
        current_user.full_name = payload.full_name or None

    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> None:
    user = db.query(User).filter(User.email == payload.email).first()

    if user:
        token = create_password_reset_token(user.id, user.hashed_password)
        link = f"{settings.frontend_url}/#/reset-password/{token}"
        send_email(
            user.email,
            "Réinitialisation de votre mot de passe",
            "Bonjour,\n\n"
            "Vous avez demandé à réinitialiser votre mot de passe Finance Tracker.\n"
            f"Cliquez sur ce lien pour choisir un nouveau mot de passe :\n\n{link}\n\n"
            f"Ce lien expire dans {settings.reset_token_expire_minutes} minutes et ne peut "
            "servir qu'une fois.\n\n"
            "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : "
            "votre mot de passe reste inchangé.",
        )

    # Always 204, even for an unknown address: the response must not reveal
    # whether an account exists.


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> None:
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Ce lien est invalide ou a expiré",
    )

    decoded = decode_password_reset_token(payload.token)
    if decoded is None:
        raise invalid

    user_id, fingerprint = decoded
    user = db.query(User).filter(User.id == user_id).first()
    # The fingerprint stops a link being replayed after the password changed.
    if not user or password_fingerprint(user.hashed_password) != fingerprint:
        raise invalid

    user.hashed_password = hash_password(payload.new_password)
    db.commit()


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect",
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import user_repo
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


def register(db: Session, req: RegisterRequest) -> TokenResponse:
    if user_repo.get_by_email(db, req.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = user_repo.create(db, obj_in={"email": req.email, "hashed_password": hash_password(req.password)})
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token)


def login(db: Session, req: LoginRequest) -> TokenResponse:
    user = user_repo.get_by_email(db, req.email)
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token)

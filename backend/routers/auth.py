from typing import Optional
from fastapi import APIRouter, Depends, Response, Request, Cookie, HTTPException
from sqlalchemy.orm import Session

from config import GOOGLE_CLIENT_ID
from database import get_db
from schemas import UserCreate, UserResponse, GoogleAuthRequest
from services.auth_service import (
    continue_user,
    verify_google_and_continue,
    create_access_token,
    get_user_from_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

COOKIE_MAX_AGE = 60 * 60 * 24 * 7


def _set_auth_cookie(response: Response, user_id: int, email: str):
    token = create_access_token(user_id=user_id, email=email)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/"
    )
    return token


@router.get("/config")
def get_auth_config():
    return {
        "google_client_id": GOOGLE_CLIENT_ID or ""
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    request: Request,
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    token = access_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = get_user_from_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    return user


@router.post("/continue", response_model=UserResponse)
def user_continue(
    user: UserCreate,
    response: Response,
    db: Session = Depends(get_db)
):
    user_obj = continue_user(db, user)
    _set_auth_cookie(response, user_obj.id, user_obj.email)
    return user_obj


@router.post("/google", response_model=UserResponse)
def google_auth(
    payload: GoogleAuthRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    user_obj = verify_google_and_continue(db, payload.credential)
    _set_auth_cookie(response, user_obj.id, user_obj.email)
    return user_obj


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out successfully"}
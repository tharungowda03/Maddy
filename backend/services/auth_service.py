from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy.orm import Session

from config import GOOGLE_CLIENT_ID, SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_DAYS
from models import User
from schemas import UserCreate


def create_access_token(user_id: int, email: str) -> str:
    expires = datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expires,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_user_from_token(db: Session, token: str) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).first()
    except (jwt.PyJWTError, ValueError, TypeError):
        return None


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate):
    new_user = User(
        name=user.name,
        email=user.email
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def continue_user(db: Session, user: UserCreate):
    existing_user = get_user_by_email(db, user.email)

    if existing_user:
        return existing_user

    return create_user(db, user)


def verify_google_and_continue(db: Session, credential: str):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google Client ID is not configured on the server."
        )

    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo.get("email")
        if not email:
            raise HTTPException(
                status_code=400,
                detail="Google token does not contain an email address."
            )

        name = idinfo.get("name") or email.split("@")[0]
        user_create = UserCreate(name=name, email=email)
        return continue_user(db, user_create)

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid Google ID token: {str(e)}"
        )
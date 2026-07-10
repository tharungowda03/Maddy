from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import UserCreate, UserResponse
from services.auth_service import continue_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/continue", response_model=UserResponse)
def user_continue(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    return continue_user(db, user)
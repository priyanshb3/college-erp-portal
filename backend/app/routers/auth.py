from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, Token, UserResponse
from ..auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Search by identifier or email
    user = db.query(User).filter(
        (User.identifier == req.identifier.strip()) | 
        (User.email.ilike(req.identifier.strip()))
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Roll No / Faculty ID / Email or Password"
        )

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Roll No / Faculty ID / Email or Password"
        )

    access_token = create_access_token(
        data={"sub": user.identifier, "role": user.role, "user_id": user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    """Returns quick demo switch users for fast evaluation."""
    users = db.query(User).all()
    demo_list = []
    for u in users:
        demo_list.append({
            "id": u.id,
            "name": u.name,
            "identifier": u.identifier,
            "email": u.email,
            "role": u.role,
            "department": u.department,
            "designation": u.designation,
            "password": "password123",
            "avatar_url": u.avatar_url,
        })
    return demo_list

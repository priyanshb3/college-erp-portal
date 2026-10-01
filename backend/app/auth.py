import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from .schemas import TokenData

SECRET_KEY = "erp-university-super-secret-key-change-in-prod-academic-portal"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        # Fallback for plain demo passwords
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        identifier: str = payload.get("sub")
        role: str = payload.get("role")
        if identifier is None:
            raise credentials_exception
        token_data = TokenData(identifier=identifier, role=role)
    except Exception:
        raise credentials_exception
    
    user = db.query(User).filter((User.identifier == token_data.identifier) | (User.email == token_data.identifier)).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_student(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "student" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Operation requires student privileges")
    return current_user

def get_current_active_faculty(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "faculty" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Operation requires faculty privileges")
    return current_user

def get_current_active_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Operation requires administrative privileges")
    return current_user

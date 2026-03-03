from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Organization
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse, UserUpdate, OrgResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    org = Organization(id=str(uuid.uuid4()), name=data.org_name)
    db.add(org)
    db.flush()
    user = User(
        id=str(uuid.uuid4()), name=data.name, email=data.email,
        password_hash=hash_password(data.password), role="admin", organization_id=org.id,
    )
    db.add(user)
    db.commit()
    token = create_access_token({"sub": user.id, "org": org.id})
    return {"access_token": token}


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token({"sub": user.id, "org": user.organization_id})
    return {"access_token": token}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


from typing import List

@router.get("/users", response_model=List[UserResponse])
def get_org_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.organization_id:
        return [current_user]
    return db.query(User).filter(User.organization_id == current_user.organization_id).all()

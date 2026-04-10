from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.session import AuthSessionORM
from app.models.user import LoginRequest, LoginResponse, UserCreate, UserORM, UserPublic
from app.utils.auth import get_current_user
from app.utils.security import generate_token, hash_password, hash_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.scalar(select(UserORM).where(UserORM.email == payload.email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    user_data = payload.model_dump(exclude={"password"})
    user = UserORM(**user_data, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(UserORM).where(UserORM.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = generate_token()
    session = AuthSessionORM(user_id=user.id, token_hash=hash_token(token))
    db.add(session)
    db.commit()

    return LoginResponse(access_token=token, user=user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header.",
        )

    session = db.scalar(select(AuthSessionORM).where(AuthSessionORM.token_hash == hash_token(token)))
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid.",
        )

    db.delete(session)
    db.commit()
    return None


@router.get("/me", response_model=UserPublic)
def get_me(current_user: UserORM = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserPublic])
def list_users(db: Session = Depends(get_db)):
    return db.scalars(select(UserORM).order_by(UserORM.id)).all()

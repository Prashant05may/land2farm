from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.session import AuthSessionORM
from app.models.user import UserORM
from app.utils.security import hash_token


def _extract_bearer_token(authorization: str | None) -> str:
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
    return token


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> UserORM:
    token = _extract_bearer_token(authorization)
    session = db.scalar(
        select(AuthSessionORM).where(AuthSessionORM.token_hash == hash_token(token))
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid.",
        )

    user = db.scalar(select(UserORM).where(UserORM.id == session.user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found for this session.",
        )
    return user


def require_role(*roles: str):
    def dependency(current_user: UserORM = Depends(get_current_user)) -> UserORM:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Only {', '.join(roles)} accounts can access this action.",
            )
        return current_user

    return dependency

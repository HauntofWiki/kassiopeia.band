import os
import secrets
from datetime import datetime, timedelta

import bcrypt
from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Session as SessionModel, User

SESSION_DAYS = 30
SECURE_COOKIES = os.environ.get("SECURE_COOKIES", "true").lower() != "false"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_session(user_id: int, db: Session) -> str:
    session_id = secrets.token_urlsafe(64)
    expires = datetime.utcnow() + timedelta(days=SESSION_DAYS)
    sess = SessionModel(id=session_id, user_id=user_id, expires_at=expires)
    db.add(sess)
    db.commit()
    return session_id


def get_current_user(
    session_id: str = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = (
        db.query(SessionModel)
        .filter(
            SessionModel.id == session_id,
            SessionModel.expires_at > datetime.utcnow(),
        )
        .first()
    )
    if not sess:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    sess.expires_at = datetime.utcnow() + timedelta(days=SESSION_DAYS)
    db.commit()
    return sess.user


def get_optional_current_user(
    session_id: str = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not session_id:
        return None
    sess = (
        db.query(SessionModel)
        .filter(
            SessionModel.id == session_id,
            SessionModel.expires_at > datetime.utcnow(),
        )
        .first()
    )
    return sess.user if sess else None


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    return user


def require_contributor(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "contributor"):
        raise HTTPException(status_code=403, detail="Contributor access required")
    return user

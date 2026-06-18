from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import hash_password, require_admin
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/admin")


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    users = db.query(User).filter(User.role != "admin").order_by(User.created_at).all()
    return [
        {
            "username": u.username,
            "display_name": u.display_name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at,
        }
        for u in users
    ]


class CreateUserBody(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"


@router.post("/users")
def create_user(
    req: CreateUserBody,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if req.role not in ("user", "contributor", "admin"):
        raise HTTPException(400, "Invalid role")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "Username already taken")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(
        username=req.username,
        email=req.email,
        password_hash=hash_password(req.password),
        display_name=req.username,
        role=req.role,
    )
    db.add(user)
    db.commit()
    return {"ok": True, "username": user.username, "role": user.role}


class SetRoleBody(BaseModel):
    role: str


@router.put("/users/{username}/role")
def set_user_role(
    username: str,
    req: SetRoleBody,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if req.role not in ("user", "contributor"):
        raise HTTPException(400, "Role must be 'user' or 'contributor'")
    user = db.query(User).filter(User.username == username, User.role != "admin").first()
    if not user:
        raise HTTPException(404, "User not found")
    user.role = req.role
    db.commit()
    return {"ok": True, "role": user.role}


@router.delete("/users/{username}")
def delete_user(
    username: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.username == username, User.role != "admin").first()
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
    return {"ok": True}

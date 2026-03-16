import os
import time
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, ImageOps
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_optional_current_user, hash_password, verify_password
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/users")

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/uploads")
AVATAR_DIR = os.path.join(UPLOAD_DIR, "avatars")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif"}
MAX_AVATAR_BYTES = 10 * 1024 * 1024


def _user_public(user: User) -> dict:
    return {
        "username": user.username,
        "display_name": user.display_name,
        "title": user.title,
        "bio": user.bio,
        "profile_picture": user.profile_picture,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    title: str | None = None
    bio: str | None = None


@router.put("/me")
def update_profile(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.display_name is not None:
        if len(req.display_name) > 100:
            raise HTTPException(400, "Display name too long (max 100 chars)")
        user.display_name = req.display_name.strip() or None
    if req.title is not None:
        user.title = req.title.strip()[:64] or None
    if req.bio is not None:
        user.bio = req.bio or None
    db.commit()
    return _user_public(user)


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, and GIF images are allowed")

    content = await file.read()
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(400, "Image too large (max 10MB)")

    Path(AVATAR_DIR).mkdir(parents=True, exist_ok=True)

    ext = "jpg"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"{user.username}_{int(time.time())}.{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    try:
        img = Image.open(filepath)
        img = ImageOps.exif_transpose(img)
        img.thumbnail((400, 400))
        img.save(filepath)
    except Exception:
        pass

    user.profile_picture = f"/uploads/avatars/{filename}"
    db.commit()
    return {"profile_picture": user.profile_picture}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/me/password")
def change_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    if len(req.new_password) < 8:
        raise HTTPException(400, "New password must be at least 8 characters")
    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"ok": True}


@router.get("/{username}")
def get_profile(
    username: str,
    db: Session = Depends(get_db),
    viewer=Depends(get_optional_current_user),
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(404, "User not found")
    return _user_public(user)

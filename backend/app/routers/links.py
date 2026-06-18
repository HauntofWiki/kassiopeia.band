from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import SocialLink, User

router = APIRouter(prefix="/api/links")


@router.get("")
def list_links(db: Session = Depends(get_db)):
    links = db.query(SocialLink).filter(SocialLink.is_active == True).order_by(SocialLink.sort_order).all()
    return [_link_dict(l) for l in links]


@router.get("/all")
def list_all_links(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    links = db.query(SocialLink).order_by(SocialLink.sort_order).all()
    return [_link_dict(l) for l in links]


class LinkBody(BaseModel):
    label: str
    url: str
    icon: str
    sort_order: int = 100
    is_active: bool = True


@router.post("")
def create_link(body: LinkBody, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    link = SocialLink(**body.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return _link_dict(link)


@router.put("/{link_id}")
def update_link(link_id: int, body: LinkBody, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    link = db.query(SocialLink).filter(SocialLink.id == link_id).first()
    if not link:
        raise HTTPException(404, "Link not found")
    for k, v in body.model_dump().items():
        setattr(link, k, v)
    db.commit()
    return _link_dict(link)


@router.delete("/{link_id}")
def delete_link(link_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    link = db.query(SocialLink).filter(SocialLink.id == link_id).first()
    if not link:
        raise HTTPException(404, "Link not found")
    db.delete(link)
    db.commit()
    return {"ok": True}


def _link_dict(l):
    return {
        "id": l.id,
        "label": l.label,
        "url": l.url,
        "icon": l.icon,
        "sort_order": l.sort_order,
        "is_active": l.is_active,
    }

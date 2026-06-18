from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Notification, Post, User

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _notif_dict(n: Notification, db: Session) -> dict:
    post = db.get(Post, n.post_id)
    from_user = db.get(User, n.from_user_id)
    parent_post_id = post.parent_post_id if post else None
    parent_post = db.get(Post, parent_post_id) if parent_post_id else None
    return {
        "id": n.id,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat() if n.created_at else None,
        "from_username": from_user.username if from_user else "unknown",
        "post_id": n.post_id,
        "parent_post_id": parent_post_id,
        "parent_post_title": parent_post.title if parent_post else (post.title if post else None),
    }


@router.get("")
def list_notifications(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )
    return [_notif_dict(n, db) for n in notifs]


@router.get("/unread-count")
def unread_count(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).count()
    return {"count": count}


@router.post("/read-all")
def mark_all_read(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"ok": True}


@router.delete("/{notif_id}")
def dismiss(notif_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id,
    ).first()
    if n:
        db.delete(n)
        db.commit()
    return {"ok": True}

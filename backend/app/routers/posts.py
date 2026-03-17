import io
import logging
import os
import subprocess
import uuid

logger = logging.getLogger(__name__)
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
import magic
from PIL import Image, ImageOps
from sqlalchemy.orm import Session

from ..auth import get_current_user, get_optional_current_user, require_contributor
from ..database import get_db
from ..models import Post, User

router = APIRouter(prefix="/api/posts", tags=["posts"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
MAX_IMAGE_SIZE = 50 * 1024 * 1024
MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime"}


def _post_dict(post: Post) -> dict:
    return {
        "id": post.id,
        "type": post.type,
        "title": post.title,
        "description": post.description,
        "body": post.body,
        "media_path": post.media_path,
        "media_type": post.media_type,
        "thumbnail_path": post.thumbnail_path,
        "music_song": post.music_song,
        "music_artist": post.music_artist,
        "music_album": post.music_album,
        "tags": post.tags,
        "show_date": post.show_date.isoformat() if post.show_date else None,
        "show_venue": post.show_venue,
        "show_ticket_url": post.show_ticket_url,
        "is_published": post.is_published,
        "sort_order": post.sort_order,
        "is_edited": post.is_edited,
        "is_pinned": post.is_pinned,
        "parent_post_id": post.parent_post_id,
        "quoted_post_id": post.quoted_post_id,
        "created_at": post.created_at.isoformat(),
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
        "user": {
            "username": post.user.username,
            "display_name": post.user.display_name,
            "title": post.user.title,
            "profile_picture": post.user.profile_picture,
            "role": post.user.role,
        },
    }


def _normalize_tags(tags: str) -> str:
    return ','.join(t.strip() for t in tags.split(',') if t.strip())


def _make_thumbnail(image_bytes: bytes, save_path: str):
    img = Image.open(io.BytesIO(image_bytes))
    img = ImageOps.exif_transpose(img)
    img.thumbnail((800, 800), Image.LANCZOS)
    img.save(save_path, format="JPEG")


def _make_video_thumbnail(video_path: str, save_path: str) -> bool:
    result = subprocess.run(
        ["ffmpeg", "-y", "-ss", "1", "-i", video_path, "-frames:v", "1", "-q:v", "2", save_path],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        logger.error("ffmpeg thumbnail failed for %s: %s", video_path, result.stderr.decode(errors="replace"))
        return False
    return True


@router.post("")
async def create_post(
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    body: Optional[str] = Form(None),
    type: Optional[str] = Form("blog"),
    music_song: Optional[str] = Form(None),
    music_artist: Optional[str] = Form(None),
    music_album: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    show_date: Optional[str] = Form(None),
    show_venue: Optional[str] = Form(None),
    show_ticket_url: Optional[str] = Form(None),
    is_published: bool = Form(False),
    parent_post_id: Optional[int] = Form(None),
    quoted_post_id: Optional[int] = Form(None),
    media: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only contributors and admins can create root posts
    is_reply = parent_post_id is not None
    if not is_reply and current_user.role not in ("admin", "contributor"):
        raise HTTPException(403, "Contributor access required")

    if not is_reply:
        if not title or not title.strip():
            raise HTTPException(400, "title is required")

    if is_reply:
        parent = db.get(Post, parent_post_id)
        if not parent:
            raise HTTPException(404, "Parent post not found")
        if not description and not media:
            raise HTTPException(400, "Reply must have text or media")

    if quoted_post_id:
        if not db.get(Post, quoted_post_id):
            raise HTTPException(400, "Quoted post not found")

    media_path = None
    media_type = None
    thumbnail_path = None

    if media and media.filename:
        contents = await media.read()

        actual_mime = magic.from_buffer(contents[:2048], mime=True)
        if actual_mime in ALLOWED_IMAGE_TYPES:
            media_type = "image"
            max_size = MAX_IMAGE_SIZE
        elif actual_mime in ALLOWED_VIDEO_TYPES:
            media_type = "video"
            max_size = MAX_VIDEO_SIZE
        else:
            raise HTTPException(400, f"Unsupported file type: {actual_mime}")

        if len(contents) > max_size:
            raise HTTPException(400, f"File exceeds {max_size // (1024*1024)}MB limit")

        ext = media.filename.rsplit(".", 1)[-1].lower() if "." in (media.filename or "") else "bin"
        timestamp = int(datetime.utcnow().timestamp())
        uid = uuid.uuid4().hex[:8]
        subdir = "replies" if is_reply else "posts"
        filename = f"{current_user.username}_{timestamp}_{uid}.{ext}"

        save_dir = os.path.join(UPLOAD_DIR, subdir)
        thumbs_dir = os.path.join(UPLOAD_DIR, "thumbnails")
        os.makedirs(save_dir, exist_ok=True)
        os.makedirs(thumbs_dir, exist_ok=True)

        full_path = os.path.join(save_dir, filename)
        if media_type == "image":
            img = Image.open(io.BytesIO(contents))
            img = ImageOps.exif_transpose(img)
            img.thumbnail((2000, 2000), Image.LANCZOS)
            img.save(full_path)
        else:
            with open(full_path, "wb") as f:
                f.write(contents)
        media_path = f"{subdir}/{filename}"

        if media_type == "image":
            thumb_filename = f"thumb_{filename}"
            _make_thumbnail(contents, os.path.join(thumbs_dir, thumb_filename))
            thumbnail_path = f"thumbnails/{thumb_filename}"
        elif media_type == "video":
            thumb_filename = f"thumb_{filename.rsplit('.', 1)[0]}.jpg"
            ok = _make_video_thumbnail(
                os.path.join(save_dir, filename),
                os.path.join(thumbs_dir, thumb_filename),
            )
            if ok:
                thumbnail_path = f"thumbnails/{thumb_filename}"

    from datetime import date as date_type
    parsed_show_date = None
    if show_date:
        try:
            parsed_show_date = date_type.fromisoformat(show_date)
        except ValueError:
            raise HTTPException(400, "Invalid show_date format (use YYYY-MM-DD)")

    post = Post(
        user_id=current_user.id,
        type=type or "blog",
        title=title.strip() if title and title.strip() else None,
        description=description.strip() if description else None,
        body=body.strip() if body else None,
        media_path=media_path,
        media_type=media_type,
        thumbnail_path=thumbnail_path,
        music_song=music_song.strip() if music_song else None,
        music_artist=music_artist.strip() if music_artist else None,
        music_album=music_album.strip() if music_album else None,
        tags=_normalize_tags(tags) if tags else None,
        show_date=parsed_show_date,
        show_venue=show_venue.strip() if show_venue else None,
        show_ticket_url=show_ticket_url.strip() if show_ticket_url else None,
        is_published=is_published,
        parent_post_id=parent_post_id,
        quoted_post_id=quoted_post_id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _post_dict(post)


@router.get("/public-feed")
def public_feed(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    pinned = db.query(Post).filter(Post.is_pinned == True, Post.parent_post_id == None).first()
    q = db.query(Post).filter(Post.parent_post_id == None, Post.is_published == True)
    posts = q.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    result = []
    if pinned and offset == 0:
        result.append(_post_dict(pinned))
    result.extend([_post_dict(p) for p in posts if not p.is_pinned])
    return result


@router.get("/tags")
def list_tags(since: Optional[str] = None, db: Session = Depends(get_db)):
    from sqlalchemy import text
    hours = {"hour": 1, "day": 24}.get(since)
    if hours:
        rows = db.execute(text("""
            SELECT tag, COUNT(*) AS count
            FROM (
                SELECT unnest(string_to_array(lower(tags), ',')) AS tag
                FROM posts
                WHERE tags IS NOT NULL
                AND created_at >= NOW() - (:hours * INTERVAL '1 hour')
            ) t
            WHERE tag != ''
            GROUP BY tag
            ORDER BY count DESC, tag ASC
        """), {"hours": hours}).fetchall()
    else:
        rows = db.execute(text("""
            SELECT tag, COUNT(*) AS count
            FROM (
                SELECT unnest(string_to_array(lower(tags), ',')) AS tag
                FROM posts
                WHERE tags IS NOT NULL
            ) t
            WHERE tag != ''
            GROUP BY tag
            ORDER BY count DESC, tag ASC
        """)).fetchall()
    return [{"tag": row[0], "count": row[1]} for row in rows]


@router.get("/feed")
def get_feed(
    limit: int = 50,
    offset: int = 0,
    sort: str = "new",
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # All published root posts — no follow graph needed
    q = db.query(Post).filter(Post.parent_post_id == None, Post.is_published == True)
    posts = q.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    return [_post_dict(p) for p in posts]


@router.get("")
def list_posts(
    username: Optional[str] = None,
    tag: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    viewer=Depends(get_optional_current_user),
):
    from sqlalchemy import func
    q = db.query(Post).join(User)
    if not tag:
        q = q.filter(Post.parent_post_id == None)
    if username:
        q = q.filter(User.username == username)
    if tag:
        needle = f',{tag.lower().strip()},'
        padded = func.concat(',', func.lower(Post.tags), ',')
        q = q.filter(padded.contains(needle))
    if type:
        q = q.filter(Post.type == type)
    # Non-contributors only see published posts
    if not viewer or viewer.role not in ("admin", "contributor"):
        q = q.filter(Post.is_published == True)
    posts = q.order_by(Post.sort_order.asc(), Post.created_at.desc()).offset(offset).limit(limit).all()
    return [_post_dict(p) for p in posts]


@router.get("/{post_id}/replies")
def list_replies(post_id: int, db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    replies = (
        db.query(Post)
        .filter(Post.parent_post_id == post_id)
        .order_by(Post.sort_order.asc(), Post.created_at.asc())
        .all()
    )
    return [_post_dict(r) for r in replies]


@router.get("/{post_id}")
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    return _post_dict(post)


@router.put("/{post_id}")
def update_post(
    post_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    body: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    music_song: Optional[str] = Form(None),
    music_artist: Optional[str] = Form(None),
    music_album: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    show_date: Optional[str] = Form(None),
    show_venue: Optional[str] = Form(None),
    show_ticket_url: Optional[str] = Form(None),
    is_published: Optional[bool] = Form(None),
    sort_order: Optional[int] = Form(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not your post")

    if title is not None:
        post.title = title.strip() or None
    if description is not None:
        post.description = description.strip() or None
    if body is not None:
        post.body = body.strip() or None
    if type is not None:
        post.type = type
    if music_song is not None:
        post.music_song = music_song.strip() or None
    if music_artist is not None:
        post.music_artist = music_artist.strip() or None
    if music_album is not None:
        post.music_album = music_album.strip() or None
    if tags is not None:
        post.tags = _normalize_tags(tags) or None
    if show_venue is not None:
        post.show_venue = show_venue.strip() or None
    if show_ticket_url is not None:
        post.show_ticket_url = show_ticket_url.strip() or None
    if show_date is not None:
        from datetime import date as date_type
        try:
            post.show_date = date_type.fromisoformat(show_date) if show_date else None
        except ValueError:
            raise HTTPException(400, "Invalid show_date format (use YYYY-MM-DD)")
    if is_published is not None:
        post.is_published = is_published
    if sort_order is not None:
        post.sort_order = sort_order

    post.is_edited = True
    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    return _post_dict(post)


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not your post")

    for rel_path in [post.media_path, post.thumbnail_path]:
        if rel_path:
            full = os.path.join(UPLOAD_DIR, rel_path)
            if os.path.exists(full):
                os.remove(full)

    db.delete(post)
    db.commit()
    return {"ok": True}


@router.post("/{post_id}/pin")
def pin_post(post_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    db.query(Post).filter(Post.is_pinned == True).update({"is_pinned": False})
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    post.is_pinned = True
    db.commit()
    db.refresh(post)
    return _post_dict(post)


@router.delete("/{post_id}/pin")
def unpin_post(post_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    post.is_pinned = False
    db.commit()
    db.refresh(post)
    return _post_dict(post)

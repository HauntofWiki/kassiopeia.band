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
from ..models import Notification, Post, User
from .. import storage

router = APIRouter(prefix="/api/posts", tags=["posts"])

MAX_IMAGE_SIZE = 50 * 1024 * 1024
MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime"}

_IMG_FMT = {"jpg": "JPEG", "jpeg": "JPEG", "png": "PNG", "gif": "GIF"}
_IMG_MIME = {"JPEG": "image/jpeg", "PNG": "image/png", "GIF": "image/gif"}


def _post_dict(post: Post) -> dict:
    return {
        "id": post.id,
        "type": post.type,
        "title": post.title,
        "description": post.description,
        "body": post.body,
        "media_path": post.media_path,
        "media_url": storage.media_url(post.media_path),
        "media_type": post.media_type,
        "thumbnail_path": post.thumbnail_path,
        "thumbnail_url": storage.media_url(post.thumbnail_path),
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
            "profile_picture": storage.media_url(post.user.profile_picture),
            "role": post.user.role,
        },
    }


def _normalize_tags(tags: str) -> str:
    return ','.join(t.strip() for t in tags.split(',') if t.strip())


def _make_thumbnail_bytes(image_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(image_bytes))
    img = ImageOps.exif_transpose(img)
    img.thumbnail((800, 800), Image.LANCZOS)
    if img.mode in ("RGBA", "P", "LA"):
        bg = Image.new("RGB", img.size, (0, 0, 0))
        bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")
    out = io.BytesIO()
    img.save(out, format="JPEG")
    return out.getvalue()


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
    sort_order: Optional[int] = Form(None),
    parent_post_id: Optional[int] = Form(None),
    quoted_post_id: Optional[int] = Form(None),
    media: Optional[UploadFile] = File(None),
    link_media_post_id: Optional[int] = Form(None),
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
        key = f"{subdir}/{filename}"

        if media_type == "image":
            img = Image.open(io.BytesIO(contents))
            img = ImageOps.exif_transpose(img)
            img.thumbnail((2000, 2000), Image.LANCZOS)
            buf = io.BytesIO()
            fmt = _IMG_FMT.get(ext, "JPEG")
            img.save(buf, format=fmt)
            storage.upload_file(buf.getvalue(), key, _IMG_MIME.get(fmt, actual_mime))
            thumb_key = f"thumbnails/thumb_{filename.rsplit('.', 1)[0]}.jpg"
            storage.upload_file(_make_thumbnail_bytes(contents), thumb_key, "image/jpeg")
            thumbnail_path = thumb_key
        else:
            import tempfile
            tmp_v = tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False)
            tmp_t = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
            try:
                tmp_v.write(contents); tmp_v.flush(); tmp_v.close(); tmp_t.close()
                storage.upload_file(contents, key, actual_mime)
                if _make_video_thumbnail(tmp_v.name, tmp_t.name):
                    with open(tmp_t.name, "rb") as f:
                        thumb_bytes = f.read()
                    thumb_key = f"thumbnails/thumb_{filename.rsplit('.', 1)[0]}.jpg"
                    storage.upload_file(thumb_bytes, thumb_key, "image/jpeg")
                    thumbnail_path = thumb_key
            finally:
                for p in [tmp_v.name, tmp_t.name]:
                    if os.path.exists(p):
                        os.unlink(p)
        media_path = key

    if not media_path and link_media_post_id:
        source = db.get(Post, link_media_post_id)
        if source and source.media_path:
            media_path = source.media_path
            media_type = source.media_type
            thumbnail_path = source.thumbnail_path

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
        sort_order=sort_order if sort_order is not None else 1000,
        parent_post_id=parent_post_id,
        quoted_post_id=quoted_post_id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Notifications
    if is_reply:
        # Notify all admins/contributors except the poster
        targets = db.query(User).filter(
            User.role.in_(["admin", "contributor"]),
            User.id != current_user.id,
        ).all()
        for u in targets:
            db.add(Notification(user_id=u.id, type="reply", post_id=post.id, from_user_id=current_user.id))
    if quoted_post_id:
        quoted = db.get(Post, quoted_post_id)
        if quoted and quoted.user_id != current_user.id:
            db.add(Notification(user_id=quoted.user_id, type="quote", post_id=post.id, from_user_id=current_user.id))
    db.commit()

    return _post_dict(post)


@router.get("/public-feed")
def public_feed(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    pinned = db.query(Post).filter(Post.is_pinned == True, Post.parent_post_id == None).first()
    q = db.query(Post).filter(Post.parent_post_id == None, Post.is_published == True)
    posts = q.order_by(Post.sort_order.asc(), Post.created_at.desc()).offset(offset).limit(limit).all()
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
    posts = q.order_by(Post.sort_order.asc(), Post.created_at.desc()).offset(offset).limit(limit).all()
    return [_post_dict(p) for p in posts]


@router.get("")
def list_posts(
    username: Optional[str] = None,
    tag: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    has_media: bool = False,
    db: Session = Depends(get_db),
    viewer=Depends(get_optional_current_user),
):
    from sqlalchemy import func
    q = db.query(Post).join(User)
    if not tag:
        q = q.filter(Post.parent_post_id == None)
    if has_media:
        q = q.filter(Post.media_path != None)
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
async def update_post(
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
    media: Optional[UploadFile] = File(None),
    link_media_post_id: Optional[int] = Form(None),
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

    if link_media_post_id and not (media and media.filename):
        source = db.get(Post, link_media_post_id)
        if source and source.media_path:
            post.media_path = source.media_path
            post.media_type = source.media_type
            post.thumbnail_path = source.thumbnail_path

    if media and media.filename:
        contents = await media.read()
        mime = magic.from_buffer(contents[:2048], mime=True)
        if mime in ALLOWED_IMAGE_TYPES:
            new_media_type = "image"
        elif mime in ALLOWED_VIDEO_TYPES:
            new_media_type = "video"
        else:
            raise HTTPException(400, "Unsupported file type")
        # Remove old files from B2
        for old_key in [post.media_path, post.thumbnail_path]:
            storage.delete_file(old_key)
        ext = media.filename.rsplit(".", 1)[-1].lower() if "." in (media.filename or "") else "bin"
        uid = uuid.uuid4().hex
        subdir = "images" if new_media_type == "image" else "videos"
        filename = f"{uid}.{ext}"
        key = f"{subdir}/{filename}"
        if new_media_type == "image":
            img = Image.open(io.BytesIO(contents))
            img = ImageOps.exif_transpose(img)
            img.thumbnail((2000, 2000), Image.LANCZOS)
            buf = io.BytesIO()
            fmt = _IMG_FMT.get(ext, "JPEG")
            img.save(buf, format=fmt)
            storage.upload_file(buf.getvalue(), key, _IMG_MIME.get(fmt, mime))
            thumb_key = f"thumbnails/thumb_{uid}.jpg"
            storage.upload_file(_make_thumbnail_bytes(contents), thumb_key, "image/jpeg")
            post.thumbnail_path = thumb_key
        else:
            import tempfile
            tmp_v = tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False)
            tmp_t = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
            try:
                tmp_v.write(contents); tmp_v.flush(); tmp_v.close(); tmp_t.close()
                storage.upload_file(contents, key, mime)
                if _make_video_thumbnail(tmp_v.name, tmp_t.name):
                    with open(tmp_t.name, "rb") as f:
                        thumb_bytes = f.read()
                    thumb_key = f"thumbnails/thumb_{uid}.jpg"
                    storage.upload_file(thumb_bytes, thumb_key, "image/jpeg")
                    post.thumbnail_path = thumb_key
            finally:
                for p in [tmp_v.name, tmp_t.name]:
                    if os.path.exists(p):
                        os.unlink(p)
        post.media_path = key
        post.media_type = new_media_type

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

    for key in [post.media_path, post.thumbnail_path]:
        storage.delete_file(key)

    db.query(Post).filter(Post.quoted_post_id == post_id).update({"quoted_post_id": None}, synchronize_session=False)
    db.query(Post).filter(Post.parent_post_id == post_id).update({"parent_post_id": None}, synchronize_session=False)
    db.flush()
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

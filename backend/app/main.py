import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import SocialLink, User
from app.routers import admin, auth, events, links, notifications, posts, users

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="kassiopeia.band API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://kassiopeia.band", "https://kass.fm"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(links.router)
app.include_router(notifications.router)
app.include_router(events.router)

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/uploads")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR, check_dir=False), name="uploads")


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    _migrate()
    _seed_admin()


def _migrate():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE posts ALTER COLUMN title DROP NOT NULL"))
        db.execute(text("ALTER TABLE posts ALTER COLUMN media_path DROP NOT NULL"))
        db.execute(text("ALTER TABLE posts ALTER COLUMN media_type DROP NOT NULL"))
        db.execute(text(
            "ALTER TABLE posts ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'blog'"
        ))
        db.execute(text(
            "ALTER TABLE posts ADD COLUMN IF NOT EXISTS body TEXT"
        ))
        db.execute(text(
            "ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        db.execute(text(
            "ALTER TABLE posts ADD COLUMN IF NOT EXISTS show_date DATE"
        ))
        db.execute(text(
            "ALTER TABLE posts ADD COLUMN IF NOT EXISTS show_venue VARCHAR(255)"
        ))
        db.execute(text(
            "ALTER TABLE posts ADD COLUMN IF NOT EXISTS show_ticket_url VARCHAR(500)"
        ))
        db.execute(text(
            "ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        db.execute(text(
            "ALTER TABLE posts ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 1000"
        ))
        db.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'"
        ))
        db.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(64)"
        ))
        # Migrate old is_admin flag to role
        db.execute(text(
            "UPDATE users SET role = 'admin' WHERE is_admin = TRUE AND role = 'user'"
        ))
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS social_links (
                id SERIAL PRIMARY KEY,
                label VARCHAR(50) NOT NULL,
                url VARCHAR(500) NOT NULL,
                icon VARCHAR(50) NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 100,
                is_active BOOLEAN NOT NULL DEFAULT TRUE
            )
        """))
        db.commit()
        _seed_links(db)
    except Exception:
        db.rollback()

    # Separate migration blocks so one failure doesn't roll back others
    try:
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL,
                post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _seed_links(db):
    if db.query(SocialLink).count() > 0:
        return
    defaults = [
        ("Spotify",     "https://open.spotify.com/album/5PfHD7DPWOB8yLVEeGLSnz", "spotify",    1),
        ("Bandcamp",    "https://kassiopeiawillbeheard.bandcamp.com/",              "bandcamp",   2),
        ("YouTube",     "https://www.youtube.com/@kassiopeiawillbeheard",           "youtube",    3),
        ("Apple Music", "https://music.apple.com/us/artist/kassiopeia/1859287331",  "apple",      4),
        ("Instagram",   "https://www.instagram.com/kassiopeia.will.be.heard/",      "instagram",  5),
        ("SoundCloud",  "https://soundcloud.com/kassiopeiawillbeheard/",            "soundcloud", 6),
        ("TikTok",      "https://www.tiktok.com/@kassiopeiawillbeheard/",           "tiktok",     7),
        ("Bluesky",     "https://bsky.app",                                         "bluesky",    8),
    ]
    for label, url, icon, order in defaults:
        db.add(SocialLink(label=label, url=url, icon=icon, sort_order=order))
    db.commit()


def _seed_admin():
    password = os.environ.get("ADMIN_PASSWORD")
    if not password:
        return
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.role == "admin").first():
            db.add(User(
                username="richard",
                email="admin@kassiopeia.band",
                password_hash=hash_password(password),
                display_name="Richard",
                role="admin",
            ))
            db.commit()
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}

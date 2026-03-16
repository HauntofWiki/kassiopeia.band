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
from app.models import User
from app.routers import admin, auth, posts, users

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="kassiopeia.band API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://kassiopeia.band"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(posts.router)

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
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'"
        ))
        db.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(64)"
        ))
        # Migrate old is_admin flag to role
        db.execute(text(
            "UPDATE users SET role = 'admin' WHERE is_admin = TRUE AND role = 'user'"
        ))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


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

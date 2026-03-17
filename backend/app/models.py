from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100))
    title = Column(String(64))
    bio = Column(Text)
    profile_picture = Column(String(255))
    role = Column(String(20), default="user", nullable=False)  # admin, contributor, user
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(20), default="blog", nullable=False)  # video, blog, show, release
    title = Column(String(255))
    description = Column(Text)
    body = Column(Text)  # markdown body for blog posts
    media_path = Column(String(500))
    media_type = Column(String(10))
    thumbnail_path = Column(String(500))
    music_song = Column(String(255))
    music_artist = Column(String(255))
    music_album = Column(String(255))
    tags = Column(String(500))
    parent_post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    quoted_post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    show_date = Column(Date, nullable=True)
    show_venue = Column(String(255), nullable=True)
    show_ticket_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=1000, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="posts")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(128), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    token = Column(String(128), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

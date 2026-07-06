"""
Database configuration for Procify.

Sets up the SQLite engine, a session factory (SessionLocal), the declarative
Base that all models inherit from, and a `get_db` dependency that hands a
session to each request and closes it afterwards.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./procify.db"

# `check_same_thread=False` is required for SQLite when used with FastAPI,
# because a single connection may be touched by more than one thread.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# Each instance of SessionLocal is a database session. It is not a session yet
# until instantiated inside `get_db`.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All SQLAlchemy models inherit from this Base.
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and guarantees it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings # Import your settings

# Create the SQLAlchemy engine using the DATABASE_URL from settings
# connect_args is often used for SQLite, may not be needed for PostgreSQL
# pool_pre_ping=True helps manage connections that might have timed out
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
    # For PostgreSQL, pool size defaults might be sufficient
    # pool_size=5, max_overflow=10
)

# Create a configured "Session" class
# autocommit=False and autoflush=False are standard defaults
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency function to get a DB session for each request
def get_db():
    """
    FastAPI dependency that provides a SQLAlchemy database session.
    Ensures the session is always closed after the request.
    """
    db = SessionLocal()
    try:
        yield db # Provide the session to the route handler
    finally:
        db.close() # Ensure the session is closed
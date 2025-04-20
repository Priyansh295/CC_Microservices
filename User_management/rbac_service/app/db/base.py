# app/db/base.py
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String # Import basic types if needed for base, but usually not

class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""
    # You can define common columns or methods here if needed,
    # for example, an 'id' column, but we'll define primary keys in each model for clarity.
    pass

# You can also define metadata here if preferred
# metadata = Base.metadata

# Models will inherit from this Base class
# e.g. class Role(Base): ...
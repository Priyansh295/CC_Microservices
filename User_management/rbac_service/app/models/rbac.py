# app/models/rbac.py
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, ForeignKey, Table, DateTime, UniqueConstraint
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID # Use UUID type for primary keys

from app.db.base import Base # Import the Base class we defined

# Association Table for the Many-to-Many relationship between Roles and Permissions
role_permissions_table = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.role_id"), primary_key=True),
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.permission_id"), primary_key=True),
    Column("assigned_at", DateTime, default=datetime.utcnow)
)

# Association Table for the Many-to-Many relationship between Users and Roles
# Note: We don't define a User model here, just the user_id which references users in another service/table
user_roles_table = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", String, primary_key=True), # Assuming user_id is a string (e.g., from Auth service)
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.role_id"), primary_key=True),
    Column("assigned_at", DateTime, default=datetime.utcnow)
    # Consider adding a UniqueConstraint if a user can only have a role once
    # UniqueConstraint('user_id', 'role_id', name='uq_user_role') # Handled by PK here
)

class Role(Base):
    __tablename__ = "roles"

    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to Permissions (Many-to-Many)
    permissions: Mapped[list["Permission"]] = relationship(
        secondary=role_permissions_table,
        back_populates="roles"
    )

    # Relationship back to Users (via user_roles table - useful for seeing users in a role, but less common query)
    # user_associations = relationship("UserRoleAssociation", back_populates="role")


class Permission(Base):
    __tablename__ = "permissions"

    permission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Using a structured name like 'resource:action' is recommended
    permission_name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to Roles (Many-to-Many)
    roles: Mapped[list["Role"]] = relationship(
        secondary=role_permissions_table,
        back_populates="permissions"
    )

# Note: We are not creating separate classes for the association tables
# (`role_permissions`, `user_roles`) when using `Table()` directly like this
# unless we need to store extra data *on the association itself* beyond the foreign keys.
# SQLAlchemy handles the relationships defined in Role and Permission models.
# We will query these association tables directly in our CRUD operations when needed.
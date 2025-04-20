# app/crud/rbac.py
from sqlalchemy.orm import Session
from sqlalchemy import select, delete, insert, text # Added delete, insert
from typing import List, Optional
from uuid import UUID # Added UUID import

# Import models, schemas, and association tables
from app.models.rbac import Role, Permission, user_roles_table, role_permissions_table
from app.schemas.rbac import RoleCreate, PermissionCreate

# --- Role CRUD ---

def get_role(db: Session, role_id: UUID) -> Optional[Role]: # Changed role_id type to UUID
     """Gets a single role by its ID."""
     # Ensure role_id is UUID type if passed as string initially by API path param converter
     # No, path param converter should handle this with type hint UUID in endpoint
     return db.get(Role, role_id) # db.get is efficient for PK lookups

def get_role_by_name(db: Session, role_name: str) -> Optional[Role]:
    """Gets a single role by its name."""
    statement = select(Role).where(Role.role_name == role_name)
    return db.execute(statement).scalar_one_or_none()

def get_roles(db: Session, skip: int = 0, limit: int = 100) -> List[Role]:
    """Gets a list of roles with pagination."""
    statement = select(Role).offset(skip).limit(limit).order_by(Role.role_name) # Added ordering
    # Use scalars().all() for list of ORM objects
    # Need options(selectinload(Role.permissions)) if you want permissions preloaded
    return db.execute(statement).scalars().all()

def create_role(db: Session, *, role_in: RoleCreate) -> Role:
    """Creates a new role."""
    # Create a new Role ORM object from the Pydantic schema
    db_role = Role(**role_in.model_dump())
    db.add(db_role) # Add to session
    db.commit() # Commit transaction to save to DB
    db.refresh(db_role) # Refresh instance to get DB-generated values (like ID, timestamps)
    return db_role

# --- Permission CRUD ---

def get_permission(db: Session, permission_id: UUID) -> Optional[Permission]: # Added permission_id type hint
    """Gets a single permission by its ID."""
    return db.get(Permission, permission_id)

def get_permission_by_name(db: Session, permission_name: str) -> Optional[Permission]:
     """Gets a single permission by its name."""
     statement = select(Permission).where(Permission.permission_name == permission_name)
     return db.execute(statement).scalar_one_or_none()

def get_permissions(db: Session, skip: int = 0, limit: int = 100) -> List[Permission]: # Added this function
    """Gets a list of permissions with pagination."""
    statement = select(Permission).offset(skip).limit(limit).order_by(Permission.permission_name) # Added ordering
    return db.execute(statement).scalars().all()

def create_permission(db: Session, *, permission_in: PermissionCreate) -> Permission:
    """Creates a new permission."""
    db_permission = Permission(**permission_in.model_dump())
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission

# --- Role-Permission Assignment CRUD ---

def assign_permission_to_role(db: Session, *, role: Role, permission: Permission) -> Role: # Added this function
    """Assigns a permission to a role. Returns the updated Role."""
    # SQLAlchemy's relationship management handles the association table insert
    # Check if permission is already assigned to avoid potential issues, though set logic handles it
    if permission not in role.permissions:
        role.permissions.append(permission)
        db.add(role) # Add role to session ensures the change is tracked
        db.commit()
        db.refresh(role) # Refresh to load the updated permissions list if needed elsewhere immediately
    return role

def remove_permission_from_role(db: Session, *, role: Role, permission: Permission) -> Role: # Added this function
    """Removes a permission from a role. Returns the updated Role."""
    # SQLAlchemy's relationship management handles the association table delete
    if permission in role.permissions:
        role.permissions.remove(permission)
        db.add(role) # Add role to session ensures the change is tracked
        db.commit()
        db.refresh(role) # Refresh to load the updated permissions list if needed elsewhere immediately
    return role

# --- User-Role Assignment CRUD ---

def assign_role_to_user(db: Session, *, user_id: str, role_id: UUID) -> None: # Added this function
    """Assigns a role to a user (inserts into user_roles table)."""
    # Using core table directly is often easier for simple association inserts/deletes

    # Check if assignment already exists
    check_stmt = select(user_roles_table).where(
        user_roles_table.c.user_id == user_id,
        user_roles_table.c.role_id == role_id
    )
    exists = db.execute(check_stmt).first()

    if not exists:
        # Use SQLAlchemy Core insert statement
        insert_stmt = insert(user_roles_table).values(user_id=user_id, role_id=role_id)
        db.execute(insert_stmt)
        db.commit()
    # No object to refresh as we're manipulating the association table directly

def remove_role_from_user(db: Session, *, user_id: str, role_id: UUID) -> None: # Added this function
    """Removes a role from a user (deletes from user_roles table)."""
    # Use SQLAlchemy Core delete statement
    delete_stmt = delete(user_roles_table).where(
         user_roles_table.c.user_id == user_id,
         user_roles_table.c.role_id == role_id
    )
    result = db.execute(delete_stmt)
    db.commit()
    # result.rowcount can tell you if a row was deleted (optional check)

def get_user_roles(db: Session, *, user_id: str) -> List[Role]: # Added this function
    """Gets all roles assigned to a specific user."""
    # Select Role objects by joining through the user_roles association table
    stmt = select(Role).join(user_roles_table).where(user_roles_table.c.user_id == user_id).order_by(Role.role_name) # Added ordering
    return db.execute(stmt).scalars().all()
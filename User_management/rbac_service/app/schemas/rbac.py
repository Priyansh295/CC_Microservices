# app/schemas/rbac.py
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import List, Optional # Use Optional for Python 3.9+

# --- Permission Schemas ---

class PermissionBase(BaseModel):
    permission_name: str = Field(..., min_length=3, max_length=100, description="Permission name (e.g., resource:action)")
    description: Optional[str] = Field(None, max_length=255, description="Detailed description of the permission")

class PermissionCreate(PermissionBase):
    pass # No extra fields needed for creation beyond base

class PermissionResponse(PermissionBase):
    permission_id: UUID
    created_at: datetime
    updated_at: datetime

    # Pydantic V2 Config for ORM mode
    model_config = ConfigDict(from_attributes=True)


# --- Role Schemas ---

class RoleBase(BaseModel):
    role_name: str = Field(..., min_length=3, max_length=50, description="Name of the role")
    description: Optional[str] = Field(None, max_length=255, description="Detailed description of the role")

class RoleCreate(RoleBase):
   pass # No extra fields needed for creation beyond base

# For response, we might want to include the list of permissions
class RoleResponse(RoleBase):
    role_id: UUID
    created_at: datetime
    updated_at: datetime
    permissions: List[PermissionResponse] = [] # Include associated permissions

    # Pydantic V2 Config for ORM mode
    model_config = ConfigDict(from_attributes=True)


# --- Assignment Schemas (for request bodies) ---

class RolePermissionAssignment(BaseModel):
    # Can assign by ID or name for convenience
    permission_id: Optional[UUID] = None
    permission_name: Optional[str] = None

class UserRoleAssignment(BaseModel):
    # Can assign by ID or name for convenience
    role_id: Optional[UUID] = None
    role_name: Optional[str] = None


# --- Check Schemas ---

class CheckRequest(BaseModel):
    user_id: str = Field(..., description="ID of the user performing the action")
    permission: str = Field(..., description="Permission name required (e.g., resource:action)")
    # Optional: Add resource context if needed for more granular checks
    # resource_context: Optional[dict] = None

class CheckResponse(BaseModel):
    allowed: bool
    reason: Optional[str] = None # Optional reason for denial


# --- User Role Schemas ---
# Schema for listing roles assigned to a user
class UserRoleResponseItem(BaseModel):
    role_id: UUID
    role_name: str
    assigned_at: datetime

    model_config = ConfigDict(from_attributes=True) # If reading from an ORM object representing the join table row
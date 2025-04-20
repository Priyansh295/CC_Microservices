# app/api/v1/endpoints/manage.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID # Import UUID

from app.db.session import get_db
# Import necessary schemas
from app.schemas.rbac import (
    RoleCreate, RoleResponse,
    PermissionCreate, PermissionResponse,
    RolePermissionAssignment, # For request body when assigning perm to role
    UserRoleAssignment, # For request body when assigning role to user
    UserRoleResponseItem # For response when getting user roles
)
from app.crud import rbac as crud
# Import models needed for fetching objects before assignment/removal
from app.models.rbac import Role, Permission

router = APIRouter()

# === Role Endpoints ===

@router.post(
    "/roles",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Role",
    description="Create a new role."
)
def create_new_role(
    *,
    db: Session = Depends(get_db),
    role_in: RoleCreate
) -> RoleResponse:
    existing_role = crud.get_role_by_name(db=db, role_name=role_in.role_name)
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role with name '{role_in.role_name}' already exists.",
        )
    created_role = crud.create_role(db=db, role_in=role_in)
    return created_role

@router.get(
    "/roles",
    response_model=List[RoleResponse],
    summary="List Roles",
    description="Get a list of all roles with pagination."
)
def list_all_roles(
    *,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=200, description="Maximum number of records")
) -> List[RoleResponse]:
    roles = crud.get_roles(db=db, skip=skip, limit=limit)
    return roles

@router.get(
    "/roles/{role_id}",
    response_model=RoleResponse,
    summary="Get Role by ID",
    description="Get details for a specific role by its ID."
)
def get_role_by_id(
    *,
    db: Session = Depends(get_db),
    role_id: UUID = Path(..., description="The ID of the role to retrieve")
) -> RoleResponse:
    role = crud.get_role(db=db, role_id=role_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return role


# === Permission Endpoints ===

@router.post(
    "/permissions",
    response_model=PermissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Permission",
    description="Create a new permission."
)
def create_new_permission(
    *,
    db: Session = Depends(get_db),
    permission_in: PermissionCreate
) -> PermissionResponse:
    existing_perm = crud.get_permission_by_name(db=db, permission_name=permission_in.permission_name)
    if existing_perm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permission with name '{permission_in.permission_name}' already exists.",
        )
    created_perm = crud.create_permission(db=db, permission_in=permission_in)
    return created_perm

@router.get(
    "/permissions",
    response_model=List[PermissionResponse],
    summary="List Permissions",
    description="Get a list of all permissions with pagination."
)
def list_all_permissions(
    *,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=200, description="Maximum number of records")
) -> List[PermissionResponse]:
    permissions = crud.get_permissions(db=db, skip=skip, limit=limit)
    return permissions

@router.get(
    "/permissions/{permission_id}",
    response_model=PermissionResponse,
    summary="Get Permission by ID",
    description="Get details for a specific permission by its ID."
)
def get_permission_by_id(
    *,
    db: Session = Depends(get_db),
    permission_id: UUID = Path(..., description="The ID of the permission to retrieve")
) -> PermissionResponse:
    permission = crud.get_permission(db=db, permission_id=permission_id)
    if not permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
    return permission

# === Role <-> Permission Assignment Endpoints ===

@router.post(
    "/roles/{role_id}/permissions",
    response_model=RoleResponse, # Return the updated role
    summary="Assign Permission to Role",
    description="Assign an existing permission to an existing role."
)
def assign_permission_to_role_endpoint(
    *,
    db: Session = Depends(get_db),
    role_id: UUID = Path(..., description="ID of the role"),
    assignment_in: RolePermissionAssignment # Request body contains perm ID or name
) -> RoleResponse:
    role = crud.get_role(db=db, role_id=role_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    permission = None
    if assignment_in.permission_id:
        permission = crud.get_permission(db=db, permission_id=assignment_in.permission_id)
    elif assignment_in.permission_name:
        permission = crud.get_permission_by_name(db=db, permission_name=assignment_in.permission_name)

    if not permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")

    updated_role = crud.assign_permission_to_role(db=db, role=role, permission=permission)
    return updated_role

@router.delete(
    "/roles/{role_id}/permissions/{permission_id}",
    response_model=RoleResponse, # Return the updated role
    summary="Remove Permission from Role",
    description="Remove a permission assignment from a role."
)
def remove_permission_from_role_endpoint(
    *,
    db: Session = Depends(get_db),
    role_id: UUID = Path(..., description="ID of the role"),
    permission_id: UUID = Path(..., description="ID of the permission to remove")
) -> RoleResponse:
    role = crud.get_role(db=db, role_id=role_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    permission = crud.get_permission(db=db, permission_id=permission_id)
    if not permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")

    updated_role = crud.remove_permission_from_role(db=db, role=role, permission=permission)
    return updated_role

# === User <-> Role Assignment Endpoints ===
# Note: user_id is typically a string provided by an external Authentication service

@router.post(
    "/users/{user_id}/roles",
    status_code=status.HTTP_204_NO_CONTENT, # Success means no content needs returning
    summary="Assign Role to User",
    description="Assign an existing role to a user (by user ID)."
)
def assign_role_to_user_endpoint(
    *,
    db: Session = Depends(get_db),
    user_id: str = Path(..., description="ID of the user"),
    assignment_in: UserRoleAssignment # Request body contains role ID or name
) -> None: # Return None on success with 204
    role = None
    if assignment_in.role_id:
        role = crud.get_role(db=db, role_id=assignment_in.role_id)
    elif assignment_in.role_name:
        role = crud.get_role_by_name(db=db, role_name=assignment_in.role_name)

    if not role:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    crud.assign_role_to_user(db=db, user_id=user_id, role_id=role.role_id)
    return None # Return None for 204 response

@router.delete(
    "/users/{user_id}/roles/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove Role from User",
    description="Remove a role assignment from a user."
)
def remove_role_from_user_endpoint(
    *,
    db: Session = Depends(get_db),
    user_id: str = Path(..., description="ID of the user"),
    role_id: UUID = Path(..., description="ID of the role to remove")
) -> None:
    # Optional: Check if role exists first, though delete won't fail if it doesn't
    role = crud.get_role(db=db, role_id=role_id)
    if not role:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    crud.remove_role_from_user(db=db, user_id=user_id, role_id=role_id)
    return None

@router.get(
    "/users/{user_id}/roles",
    response_model=List[RoleResponse], # Return list of roles user has
    summary="List User's Roles",
    description="Get a list of all roles assigned to a specific user."
)
def list_user_roles_endpoint(
    *,
    db: Session = Depends(get_db),
    user_id: str = Path(..., description="ID of the user")
) -> List[RoleResponse]:
    roles = crud.get_user_roles(db=db, user_id=user_id)
    # Note: RoleResponse includes permissions; this might be inefficient if not needed here.
    # Consider creating a simpler Role schema just for this response if performance matters.
    return roles
# app/api/v1/endpoints/check.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db # DB session dependency
from app.schemas.rbac import CheckRequest, CheckResponse # Pydantic Schemas
from app.core.security import check_user_permission # Core logic function

router = APIRouter()

@router.post(
    "/check", # Endpoint path relative to router prefix
    response_model=CheckResponse,
    summary="Check User Permission",
    description="Check if a user has the specified permission based on their roles."
)
def check_permission_endpoint(
    *,
    db: Session = Depends(get_db), # Inject DB session
    request_data: CheckRequest # Validate request body against schema
) -> CheckResponse:
    """
    API endpoint to check user permissions.
    Receives user_id and permission name, returns whether access is allowed.
    """
    allowed = check_user_permission(
        db=db,
        user_id=request_data.user_id,
        permission_name=request_data.permission
    )

    # Although the check logic itself returns boolean, the endpoint could
    # potentially deny access for other reasons later (e.g., account status).
    # For now, directly return the result of the check.
    # If not allowed, we could raise HTTPException(status_code=403),
    # but returning allowed: false in the response body is also common.
    return CheckResponse(allowed=allowed)
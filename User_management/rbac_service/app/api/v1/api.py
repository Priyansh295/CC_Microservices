# app/api/v1/api.py
from fastapi import APIRouter

# Import the routers from the endpoint modules
from app.api.v1.endpoints import check, manage

# Create the main router for API version 1
api_router = APIRouter()

# Include the check router
# All routes defined in check.router will be available under the main router
# Tags are used for grouping endpoints in the OpenAPI documentation
api_router.include_router(check.router, tags=["Permission Check"])

# Include the management router
# All routes defined in manage.router will be available under the main router
api_router.include_router(manage.router, tags=["Management"])

# You could add more routers here as your API grows
# e.g., api_router.include_router(permissions.router, prefix="/permissions", tags=["Permissions"])
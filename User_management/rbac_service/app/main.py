# app/main.py
from fastapi import FastAPI

# Import the main API router from api/v1/api.py
from app.api.v1.api import api_router
# Import settings if needed for app configuration, e.g., CORS
# from app.core.config import settings

# Create the FastAPI application instance
# You can configure title, description, version, etc. for OpenAPI docs
app = FastAPI(
    title="RBAC Microservice",
    description="Manages Roles, Permissions, and Access Checks.",
    version="0.1.0",
    openapi_url="/api/v1/openapi.json", # Default OpenAPI schema path
    docs_url="/api/v1/docs", # Path for Swagger UI
    redoc_url="/api/v1/redoc" # Path for ReDoc documentation
)

# Include the API router
# All routes defined in api_router (check, manage/roles) will be prefixed with /api/v1
# e.g., /api/v1/check, /api/v1/roles
app.include_router(api_router, prefix="/api/v1")

# Optional: Add a simple root endpoint for health check or basic info
@app.get("/", summary="Health Check", tags=["Root"])
def read_root():
    """
    Root endpoint providing basic service status.
    """
    return {"status": "OK", "service": "RBAC Service"}

# Add an explicit health endpoint for better compatibility with NGINX health checks
@app.get("/health", summary="Health Check", tags=["Health"])
def health_check():
    """
    Explicit health check endpoint for monitoring and load balancing.
    """
    return {"status": "healthy", "service": "rbac-service"}

# Also add health endpoint at the API prefix location for NGINX config
@app.get("/api/v1/health", summary="Health Check", tags=["Health"])
def api_health_check():
    """
    Health check endpoint at API prefix path.
    """
    return {"status": "healthy", "service": "rbac-service"}

# Optional: Add CORS middleware if requests will come from different origins (e.g., a frontend app)
# from fastapi.middleware.cors import CORSMiddleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Or specify allowed origins: ["http://localhost:3000"]
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Code to run on startup (e.g., database connection checks) could go here
# @app.on_event("startup")
# async def startup_event():
#     # Example: try to connect to db
#     pass
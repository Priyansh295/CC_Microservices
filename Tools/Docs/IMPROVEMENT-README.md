# Microservices Improvements

This document outlines the improvements made to the microservices architecture based on the recommendations.

## 1. Authentication Service Improvements

### SQLite Fallback for Development and Testing

We've added a SQLite database fallback for the authentication service to avoid Supabase permission issues and make local development easier.

#### Key Files:
- `User_management/authentication/auth-microservice/src/services/sqliteService.js`: SQLite implementation
- `User_management/authentication/auth-microservice/src/services/authService.js`: Service selector
- `User_management/authentication/auth-microservice/src/controllers/authController.js`: Updated controller

#### How to Use:
- Set `AUTH_DB=sqlite` in your environment or in docker-compose to use SQLite
- Default behavior is to use SQLite when `NODE_ENV=test` or `AUTH_DB=sqlite`
- Automatic test user creation: `admin@example.com` and `user@example.com`

### Enhanced Error Handling

The authentication controller now has improved error handling with:
- Automatic fallback to mock login when database errors occur
- Detailed error messages with proper status codes
- Consistent response format

## 2. NGINX Configuration Updates

### Improved CORS Configuration

The NGINX configuration now supports multiple environments:
- Development: localhost and 127.0.0.1
- Testing/Staging: *.test.example.com and *.staging.example.com
- Production: app.example.com, www.example.com, and example.com

### Enhanced Routing

- Added a fallback for misrouted requests with `try_files` and `@frontend_redirect`
- Added a debug endpoint at `/debug` for troubleshooting request information
- Better structured health check endpoints

## 3. Standardized Port Configuration

All service ports are now managed through environment variables in `.env`:

### Internal (Container) Ports:
```
ACCESS_CONTROL_PORT=3001
VULNERABILITY_SCANNER_PORT=3002
BUG_MONITORING_PORT=3003
DATA_ENCRYPTION_PORT=3004
AUTHENTICATION_PORT=3001
RBAC_PORT=3001
```

### External (Host) Port Mappings:
```
ACCESS_CONTROL_EXTERNAL_PORT=3001
VULNERABILITY_SCANNER_EXTERNAL_PORT=3002
BUG_MONITORING_EXTERNAL_PORT=3003
DATA_ENCRYPTION_EXTERNAL_PORT=3004
AUTHENTICATION_EXTERNAL_PORT=3005
RBAC_EXTERNAL_PORT=3006
```

### Docker-Compose Integration

The `docker-compose.yml` file now uses these environment variables for all port definitions:
```yaml
ports:
  - "${ACCESS_CONTROL_EXTERNAL_PORT:-3001}:${ACCESS_CONTROL_PORT:-3001}"
```

## 4. Integration Test Improvements

We've created a robust integration testing framework:

### Scripts:
- `integration-test.js`: Main test script with retry logic
- `run-integration-tests.sh`: Bash wrapper for Unix/Linux/Mac
- `run-integration-tests.ps1`: PowerShell wrapper for Windows
- `integration-tests-package.json`: Package definitions

### Features:
- Configurable retry logic for both tests and individual API calls
- Mock login option for testing without Supabase
- Detailed, color-coded output
- Temporary test environment

### Usage:

#### Bash:
```bash
# Basic usage
./run-integration-tests.sh

# With options
./run-integration-tests.sh --url http://localhost --retries 5 --delay 10 --real-login
```

#### PowerShell:
```powershell
# Basic usage
.\run-integration-tests.ps1

# With options
.\run-integration-tests.ps1 -Url http://localhost -Retries 5 -Delay 10 -RealLogin
```

#### NPM:
```bash
# Install dependencies from integration-tests-package.json first
npm run test
npm run test:mock  # Force mock login
npm run test:real  # Force real login
npm run test:retry # Use longer retries
```

## Health Checks for All Services

All services now have properly configured health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:${PORT}/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

## How to Enable the Changes

1. **Copy the Environment Variables**: 
   - Ensure `.env` file is present in the root directory

2. **Rebuild and Restart All Services**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. **Test the Integration**:
   ```bash
   # Install dependencies
   npm install axios colors

   # Run the tests
   ./run-integration-tests.sh
   ```

4. **Access the Services**:
   - Main API Gateway: http://localhost
   - Auth Frontend: http://localhost:8080
   - Debug information: http://localhost/debug 
# Integrated Microservices

This is an integrated setup that combines Security microservices with User Management microservices.

## Services Included

### Security Microservices
- Access Control (`/api/access-control/`)
- Vulnerability Scanner (`/api/vulnerability-scanner/`)
- Bug Monitoring (`/api/bug-monitoring/`)
- Data Encryption (`/api/data-encryption/`)

### User Management Microservices
- Authentication (`/api/auth/`)
- RBAC Service (`/api/rbac/`)

## Project Structure

The project is organized into the following directories:

```
microservices/
├── Security/             # Security microservices
│   ├── access-control/   # Access control service
│   ├── vulnerability-scanner/
│   ├── bug-monitoring/
│   ├── data-encryption/
│   └── nginx/            # NGINX reverse proxy configuration
│
├── User_management/      # User management microservices
│   ├── authentication/   # Authentication service
│   ├── rbac_service/     # RBAC service
│   └── other services...
│
├── Tools/                # Utilities and helper scripts
│   ├── IntegrationTests/ # Integration test scripts
│   ├── Scripts/          # Utility scripts
│   ├── Database/         # Database setup and management
│   └── Docs/             # Documentation
│
├── docker-compose.yml    # Main Docker Compose configuration
├── .env                  # Environment variables
└── README.md             # This file
```

## Current Status

The integration has been completed with the following components working:
- NGINX gateway serving as a central proxy for all services
- Integration of authentication service with the security infrastructure
- Health checks accessible for the authentication service
- Proper configuration for handling CORS and preflight requests

## How to Run

1. Make sure you have Docker and Docker Compose installed on your system.

2. Clone the repository.

3. Run the following command to start all services:
   ```
   docker-compose up -d
   ```

4. To stop all services:
   ```
   docker-compose down
   ```

5. To rebuild all services:
   ```
   docker-compose build
   ```

6. To check service health and connectivity:
   ```
   cd Tools/Scripts
   ./security-microservices-demo.ps1
   ```

## Accessing the Services

All services are accessible through the NGINX reverse proxy:

- NGINX runs on port 80
- All microservices are accessible through their respective API endpoints under `http://localhost/api/`

### Example URLs:
- API Gateway Info: `http://localhost/`
- Authentication Service: `http://localhost/api/auth/`
- Access Control Service: `http://localhost/api/access-control/`
- Vulnerability Scanner: `http://localhost/api/vulnerability-scanner/`
- Bug Monitoring: `http://localhost/api/bug-monitoring/`
- Data Encryption: `http://localhost/api/data-encryption/`
- RBAC Service: `http://localhost/api/rbac/`

## Health Checks

Health check endpoint for the system:
- `http://localhost/health`

Health check endpoints for individual services:
- `http://localhost/api/auth/health` (✅ Working)
- `http://localhost/api/access-control/health` (✅ Working)
- `http://localhost/api/vulnerability-scanner/health`
- `http://localhost/api/bug-monitoring/health`
- `http://localhost/api/data-encryption/health`
- `http://localhost/api/rbac/health` (✅ Working)

For detailed health information including dependency status:
- `http://localhost/api/access-control/health?detailed=true`

## Service Ports

All services run internally on their designated ports but are exposed through the NGINX proxy on port 80. If you need to access a specific service directly, you can use the following ports:

- Access Control: 3001
- Vulnerability Scanner: 3002
- Bug Monitoring: 3003
- Data Encryption: 3004
- Authentication: 3005 (mapped to internal port 3001)
- RBAC: 3006 (mapped to internal port 3001)

## Service Inter-dependencies

The microservices have the following dependencies:

- **Access Control**: Depends on Authentication and RBAC
- **Vulnerability Scanner**: Depends on Authentication
- **Bug Monitoring**: Depends on Authentication
- **Data Encryption**: Depends on Authentication
- **RBAC**: Depends on Authentication and PostgreSQL database

## Testing and Validation

The project includes several testing tools:

1. **Service Health Test**: Checks if all services are running correctly
   ```
   node Tools/IntegrationTests/service-health-test.js
   ```

2. **Check Services Script**: PowerShell script that verifies container status and runs health tests
   ```
   ./Tools/Scripts/check-services.ps1
   ```

3. **Integration Tests**: Full suite of tests for API functionality
   ```
   ./Tools/Scripts/run-integration-tests.ps1
   ```

## Common Issues and Troubleshooting

### 1. Service Connectivity Issues

If services cannot connect to each other, check:
- Network configuration in `docker-compose.yml`
- Environment variables for service URLs in `.env`
- Container names and service hostnames match

Solution:
- Ensure all services are on the same Docker network
- Verify environment variables point to the correct service hostnames
- Use container names as hostnames in service-to-service communication

### 2. Authentication Failures

If authentication is failing:
- Check JWT secret configuration
- Verify token validation endpoints
- Ensure inter-service secrets match

Solution:
- Update JWT_SECRET and INTER_SERVICE_SECRET in `.env`
- Check authentication service logs for token validation errors

### 3. Service Restarts

If a service keeps restarting:
- Check logs with `docker logs [container-name]`
- Verify health check configuration
- Check for dependency issues

Solution:
- Implement retry logic for dependent service connections
- Ensure health checks don't fail due to dependent services being unreachable

## Known Issues and Future Work

1. ✅ The access-control service was continually restarting due to connectivity issues with the user management service.
   - Fixed by implementing retry logic and fallback behavior
   - Updated environment variables to point to the correct authentication service

2. Some security microservices may return 502 Bad Gateway when accessed through NGINX.
   - This could be due to internal service implementation issues
   - Check individual service logs for more information

3. Future work includes:
   - Adding more User Management microservices
   - Enhancing security between microservices using JWT tokens
   - Implementing comprehensive logging and monitoring
   - Adding database support for relevant services
   - Improving error handling across all services
   - Creating a more robust health check system
   - Setting up CI/CD pipelines for automated testing and deployment

# Microservices Integration Tests

This repository contains integration tests for the microservices architecture. The tests verify the health and functionality of all microservices in the system.

## Prerequisites

- Docker and Docker Compose installed and running
- Node.js (v14 or higher) installed
- PowerShell (for Windows) or Bash (for Linux/Mac)

## Services Tested

The integration tests cover the following services:

- NGINX (Gateway)
- Access Control Service
- Vulnerability Scanner Service
- Bug Monitoring Service
- Data Encryption Service
- Authentication Service
- RBAC Service

## Test Types

1. **Health Checks**: Verify that each service is up and running by pinging health endpoints
2. **Functional Tests**: Verify that key functionalities work correctly:
   - Authentication flow (login & token validation)
   - RBAC permissions
   - Vulnerability scanning operations
   - Data encryption/decryption
   - Bug monitoring and reporting

## How to Run the Tests

### Windows (PowerShell)

1. Ensure all microservices are running:
   ```powershell
   docker-compose up -d
   ```

2. Run the integration tests:
   ```powershell
   ./run-tests.ps1
   ```

### Linux/Mac (Bash)

1. Ensure all microservices are running:
   ```bash
   docker-compose up -d
   ```

2. Run the integration tests:
   ```bash
   ./run-tests.sh
   ```

## Configuration

You can modify the test configuration in the runner script:

- `BaseUrl`: The base URL for the microservices (default: "http://localhost")
- `MaxRetries`: Maximum number of retries for failed requests (default: 3)
- `RetryDelay`: Delay between retries in milliseconds (default: 5000)
- `UseMockLogin`: Use mock login instead of real authentication (default: true)

## Troubleshooting

If tests are failing, check the following:

1. Ensure all containers are running:
   ```
   docker ps
   ```

2. Check container logs for errors:
   ```
   docker logs [container-name]
   ```

3. Verify network connectivity between services:
   ```
   docker network inspect bridge
   ```

4. Check if the services are accessible from your host machine:
   ```
   curl http://localhost/health
   ```

## Adding New Tests

To add new tests:

1. Open `integration-test.js`
2. Add new test functions following the existing patterns
3. Update the `runTests()` function to include your new tests

## CI/CD Integration

These tests can be integrated into a CI/CD pipeline by:

1. Running the tests after deployment
2. Setting appropriate timeouts for service startup
3. Configuring failure thresholds and notifications 

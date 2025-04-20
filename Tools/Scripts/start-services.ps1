# =====================================================
# start-services.ps1
# Script to start all microservices and verify they're running correctly
# =====================================================

$ErrorActionPreference = "Stop"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = (Get-Item $ScriptPath).Parent.Parent.FullName
$TestDir = Join-Path $RootDir "Tools\IntegrationTests"
$TestScript = Join-Path $TestDir "service-health-test.js"
$CheckServicesScript = Join-Path $ScriptPath "check-services.ps1"

Write-Host "==================================================="
Write-Host "Microservices Startup Script"
Write-Host "==================================================="
Write-Host ""

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        $result = docker ps | Out-String
        if ($result -match "CONTAINER ID") {
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Check if Docker is running
if (-not (Test-DockerRunning)) {
    Write-Host "Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Docker is running..." -ForegroundColor Green

# Start the microservices using docker-compose
Write-Host ""
Write-Host "Starting all microservices..." -ForegroundColor Cyan
Set-Location $RootDir

# Check if any containers are already running
$runningContainers = docker ps --format "{{.Names}}" | Where-Object { $_ -like "microservices*" -or $_ -like "access-control" -or $_ -like "nginx-proxy" }

if ($runningContainers) {
    Write-Host "Some microservice containers are already running:" -ForegroundColor Yellow
    $runningContainers | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    
    Write-Host ""
    Write-Host "Would you like to stop and restart all containers? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "Stopping all running containers..." -ForegroundColor Cyan
        docker-compose down
    }
    else {
        Write-Host "Continuing with already running containers..." -ForegroundColor Yellow
    }
}

# Start all services using docker-compose
Write-Host "Starting all services with docker-compose..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start services with docker-compose. Please check the Docker logs." -ForegroundColor Red
    exit 1
}

# Wait for services to initialize
$maxWaitTime = 60 # seconds
$waitInterval = 5 # seconds
$elapsedTime = 0

Write-Host ""
Write-Host "Waiting for services to initialize (max $maxWaitTime seconds)..." -ForegroundColor Cyan

do {
    $allHealthy = $true
    $containers = docker ps --format "{{.Names}},{{.Status}}" | Where-Object { $_ -like "*health*" }
    
    if (-not $containers) {
        Write-Host "No containers with health status found." -ForegroundColor Yellow
        $allHealthy = $false
    }
    else {
        $containers | ForEach-Object {
            $containerInfo = $_ -split ","
            $containerName = $containerInfo[0]
            $status = $containerInfo[1]
            
            if ($status -notlike "*healthy*") {
                Write-Host "Container $containerName is still initializing or unhealthy: $status" -ForegroundColor Yellow
                $allHealthy = $false
            }
        }
    }
    
    if ($allHealthy) {
        break
    }
    
    Start-Sleep -Seconds $waitInterval
    $elapsedTime += $waitInterval
    Write-Host "Still waiting for services to be healthy... ($elapsedTime seconds elapsed)"
    
} while ($elapsedTime -lt $maxWaitTime)

if (-not $allHealthy) {
    Write-Host ""
    Write-Host "Warning: Not all services reported healthy status within the timeout period." -ForegroundColor Yellow
    Write-Host "This does not necessarily mean the services are not working." -ForegroundColor Yellow
    Write-Host "Continuing with service verification..." -ForegroundColor Yellow
}
else {
    Write-Host ""
    Write-Host "All services reported healthy status!" -ForegroundColor Green
}

# Run the service health check script
Write-Host ""
Write-Host "Running service health and connectivity checks..." -ForegroundColor Cyan
Write-Host ""
& $CheckServicesScript

# Return to original directory
Set-Location $ScriptPath

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All microservices are running and properly connected!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Some services may not be properly connected. Please check the output above for details." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Services are available at:"
Write-Host "  - API Gateway: http://localhost/"
Write-Host "  - Authentication: http://localhost/api/auth/"
Write-Host "  - Access Control: http://localhost/api/access-control/"
Write-Host "  - Vulnerability Scanner: http://localhost/api/vulnerability-scanner/"
Write-Host "  - Bug Monitoring: http://localhost/api/bug-monitoring/"
Write-Host "  - Data Encryption: http://localhost/api/data-encryption/"
Write-Host "  - RBAC Service: http://localhost/api/rbac/"
Write-Host "  - Auth Frontend: http://localhost:8080/" 
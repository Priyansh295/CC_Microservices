# =====================================================
# check-services.ps1
# Script to check the health and connectivity of all microservices
# =====================================================

$ErrorActionPreference = "Stop"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = (Get-Item $ScriptPath).Parent.Parent.FullName
$TestDir = Join-Path $RootDir "Tools\IntegrationTests"
$TestScript = Join-Path $TestDir "service-health-test.js"

Write-Host "==================================================="
Write-Host "Microservice Health and Connectivity Checker"
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
    Write-Host "Docker is not running. Starting Docker..." -ForegroundColor Yellow
    
    # This is just a suggestion, as starting Docker via script may require admin rights
    # Uncomment if you have a way to start Docker programmatically
    # Start-Process "path-to-docker-desktop"
    
    Write-Host "Please start Docker manually and press any key to continue..." -ForegroundColor Yellow
    [void][System.Console]::ReadKey($true)
    
    # Check Docker again
    if (-not (Test-DockerRunning)) {
        Write-Host "Docker is still not running. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Docker is running..." -ForegroundColor Green

# Check Docker containers status
Write-Host ""
Write-Host "Checking if microservices containers are running..." -ForegroundColor Cyan

$containers = @(
    "access-control",
    "vulnerability-scanner", 
    "bug-monitoring", 
    "data-encryption", 
    "authentication", 
    "nginx-proxy", 
    "rbac-service",
    "rbac-db",
    "auth-frontend"
)

$allRunning = $true
$stoppedContainers = @()

foreach ($container in $containers) {
    $status = docker ps -f "name=$container" --format "{{.Status}}" | Out-String
    
    if ($status -match "Up") {
        Write-Host "✅ Container $container is running" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Container $container is not running" -ForegroundColor Red
        $allRunning = $false
        $stoppedContainers += $container
    }
}

# Offer to start containers if any are not running
if (-not $allRunning) {
    Write-Host ""
    Write-Host "Some containers are not running. Would you like to start them? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "Starting containers using docker-compose..." -ForegroundColor Cyan
        
        # Change to the root directory where docker-compose.yml is located
        Set-Location $RootDir
        
        # Start only the stopped containers
        if ($stoppedContainers.Count -eq $containers.Count) {
            # If all containers are stopped, start everything
            docker-compose up -d
        }
        else {
            # Start only specific containers
            foreach ($container in $stoppedContainers) {
                docker-compose up -d $container
                Write-Host "Starting $container..."
            }
        }
        
        # Wait for containers to initialize
        Write-Host "Waiting for containers to initialize (30 seconds)..." -ForegroundColor Cyan
        Start-Sleep -Seconds 30
    }
    else {
        Write-Host "Continuing with some containers not running..." -ForegroundColor Yellow
    }
}

# Check if Node.js dependencies are installed
Write-Host ""
Write-Host "Checking Node.js dependencies..." -ForegroundColor Cyan

Set-Location $TestDir

if (-not (Test-Path (Join-Path $TestDir "node_modules"))) {
    Write-Host "Node modules not found. Installing dependencies..." -ForegroundColor Yellow
    
    # Check if package.json exists in the test directory
    if (-not (Test-Path (Join-Path $TestDir "package.json"))) {
        # Create a minimal package.json if it doesn't exist
        @{
            "name" = "service-health-test";
            "version" = "1.0.0";
            "description" = "Test script for microservices health and connectivity";
            "main" = "service-health-test.js";
            "dependencies" = @{
                "axios" = "^1.6.0"
            }
        } | ConvertTo-Json | Out-File -FilePath (Join-Path $TestDir "package.json") -Encoding utf8
    }
    
    # Install dependencies
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies. Please check your Node.js installation." -ForegroundColor Red
        exit 1
    }
}

# Run the service health test
Write-Host ""
Write-Host "Running service health and connectivity tests..." -ForegroundColor Cyan
Write-Host ""

node $TestScript

# Check if the test was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All tests passed successfully!" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "⚠️ Some tests failed. Please check the output above for details." -ForegroundColor Yellow
}

# Return to original directory
Set-Location $ScriptPath 
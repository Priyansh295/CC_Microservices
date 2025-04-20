# Integration Test Runner Script for PowerShell
# This script runs the integration tests for the microservices architecture

# Configuration
$BaseUrl = "http://localhost"
$MaxRetries = 3
$RetryDelay = 5000
$UseMockLogin = $true

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        $null = docker info
        return $true
    } catch {
        return $false
    }
}

# Function to check if Node.js is installed
function Test-NodeInstalled {
    try {
        $nodeVersion = node -v
        Write-Host "Node.js version $nodeVersion detected"
        return $true
    } catch {
        return $false
    }
}

# Function to install dependencies
function Install-Dependencies {
    Write-Host "Installing test dependencies..."
    npm install axios colors --save-dev
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Main execution
Write-Host "=== Microservices Integration Test Runner ===" -ForegroundColor Cyan

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-DockerRunning)) {
    Write-Host "Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Docker is running" -ForegroundColor Green

if (-not (Test-NodeInstalled)) {
    Write-Host "Node.js is not installed. Please install Node.js and try again." -ForegroundColor Red
    exit 1
}

# Check for package.json, create if not exists
if (-not (Test-Path -Path "package.json")) {
    Write-Host "Creating package.json..." -ForegroundColor Yellow
    @"
{
  "name": "microservices-integration-tests",
  "version": "1.0.0",
  "description": "Integration tests for microservices architecture",
  "main": "integration-test.js",
  "scripts": {
    "test": "node integration-test.js"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {}
}
"@ | Out-File -FilePath "package.json" -Encoding utf8
}

# Install dependencies
Install-Dependencies

# Set environment variables for the test
Write-Host "Setting up test environment..." -ForegroundColor Yellow
$env:TEST_BASE_URL = $BaseUrl
$env:MAX_RETRIES = $MaxRetries
$env:RETRY_DELAY = $RetryDelay
$env:USE_MOCK_LOGIN = if ($UseMockLogin) { "true" } else { "false" }

# Run the tests
Write-Host "Running integration tests..." -ForegroundColor Yellow
node integration-test.js

# Check the result
if ($LASTEXITCODE -eq 0) {
    Write-Host "Integration tests completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Integration tests failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
} 
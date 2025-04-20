# PowerShell script for running integration tests with retries

# Configuration
$MaxRetries = 5
$RetryDelay = 10  # Seconds
$TestBaseUrl = "http://localhost"
$UseMockLogin = $true

# Function to display usage
function Show-Usage {
    Write-Host "Usage: .\run-integration-tests.ps1 [options]"
    Write-Host "Options:"
    Write-Host "  -Url URL         Base URL for tests (default: $TestBaseUrl)"
    Write-Host "  -Retries N       Maximum number of retries (default: $MaxRetries)"
    Write-Host "  -Delay N         Delay between retries in seconds (default: $RetryDelay)"
    Write-Host "  -RealLogin       Use real login instead of mock login"
    exit 1
}

# Parse command line arguments
param(
    [string]$Url,
    [int]$Retries,
    [int]$Delay,
    [switch]$RealLogin,
    [switch]$Help
)

if ($Help) {
    Show-Usage
}

if ($Url) {
    $TestBaseUrl = $Url
}

if ($Retries) {
    $MaxRetries = $Retries
}

if ($Delay) {
    $RetryDelay = $Delay
}

if ($RealLogin) {
    $UseMockLogin = $false
}

# Print test configuration
Write-Host "=== Integration Test Configuration ===" -ForegroundColor Blue
Write-Host "Base URL:      $TestBaseUrl" -ForegroundColor Blue
Write-Host "Max Retries:   $MaxRetries" -ForegroundColor Blue
Write-Host "Retry Delay:   $RetryDelay seconds" -ForegroundColor Blue
Write-Host "Login Method:  $(if ($UseMockLogin) { 'Mock Login' } else { 'Real Login' })" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# Create a temporary directory for the test
$TestDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_.FullName }
Write-Host "Creating temporary test directory: $($TestDir.FullName)" -ForegroundColor Blue

# Copy test files to the temporary directory
Copy-Item -Path "integration-test.js" -Destination $TestDir.FullName
Copy-Item -Path "integration-tests-package.json" -Destination "$($TestDir.FullName)\package.json"

# Change to the temporary directory
Push-Location $TestDir.FullName

# Install dependencies
Write-Host "Installing test dependencies..." -ForegroundColor Blue
npm install --quiet

# Run the tests with retries
for ($i = 1; $i -le $MaxRetries; $i++) {
    Write-Host "Attempt $i of $MaxRetries" -ForegroundColor Yellow
    
    # Set environment variables for the test
    $env:TEST_BASE_URL = $TestBaseUrl
    $env:MAX_RETRIES = 3  # Per-request retries within the test
    $env:RETRY_DELAY = 5000  # Per-request retry delay in ms
    $env:USE_MOCK_LOGIN = $UseMockLogin.ToString().ToLower()
    
    # Run the test
    $testResult = node integration-test.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Integration tests passed on attempt $i!" -ForegroundColor Green
        Pop-Location
        Remove-Item -Recurse -Force $TestDir.FullName
        exit 0
    } else {
        Write-Host "Integration tests failed on attempt $i." -ForegroundColor Red
        if ($i -lt $MaxRetries) {
            Write-Host "Waiting $RetryDelay seconds before next attempt..." -ForegroundColor Yellow
            Start-Sleep -Seconds $RetryDelay
        }
    }
}

Write-Host "Integration tests failed after $MaxRetries attempts." -ForegroundColor Red
Pop-Location
Remove-Item -Recurse -Force $TestDir.FullName
exit 1 
#!/bin/bash

# Configuration
MAX_RETRIES=5
RETRY_DELAY=10  # Seconds
TEST_BASE_URL="http://localhost"
USE_MOCK_LOGIN=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --url URL         Base URL for tests (default: $TEST_BASE_URL)"
  echo "  --retries N       Maximum number of retries (default: $MAX_RETRIES)"
  echo "  --delay N         Delay between retries in seconds (default: $RETRY_DELAY)"
  echo "  --real-login      Use real login instead of mock login"
  echo "  --help            Display this help message"
  exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      TEST_BASE_URL="$2"
      shift 2
      ;;
    --retries)
      MAX_RETRIES="$2"
      shift 2
      ;;
    --delay)
      RETRY_DELAY="$2"
      shift 2
      ;;
    --real-login)
      USE_MOCK_LOGIN=false
      shift
      ;;
    --help)
      usage
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      usage
      ;;
  esac
done

# Print test configuration
echo -e "${BLUE}=== Integration Test Configuration ===${NC}"
echo -e "${BLUE}Base URL:      ${NC}$TEST_BASE_URL"
echo -e "${BLUE}Max Retries:   ${NC}$MAX_RETRIES"
echo -e "${BLUE}Retry Delay:   ${NC}$RETRY_DELAY seconds"
echo -e "${BLUE}Login Method:  ${NC}$([ "$USE_MOCK_LOGIN" = true ] && echo "Mock Login" || echo "Real Login")"
echo -e "${BLUE}========================================${NC}"

# Create a temporary directory for the test
TEST_DIR=$(mktemp -d)
echo -e "${BLUE}Creating temporary test directory: ${NC}$TEST_DIR"

# Copy test files to the temporary directory
cp integration-test.js integration-tests-package.json "$TEST_DIR"
cd "$TEST_DIR"
mv integration-tests-package.json package.json

# Install dependencies
echo -e "${BLUE}Installing test dependencies...${NC}"
npm install --quiet

# Run the tests with retries
for ((i=1; i<=MAX_RETRIES; i++)); do
  echo -e "${YELLOW}Attempt $i of $MAX_RETRIES${NC}"
  
  # Export environment variables for the test
  export TEST_BASE_URL="$TEST_BASE_URL"
  export MAX_RETRIES=3  # Per-request retries within the test
  export RETRY_DELAY=5000  # Per-request retry delay in ms
  export USE_MOCK_LOGIN="$USE_MOCK_LOGIN"
  
  # Run the test
  if node integration-test.js; then
    echo -e "${GREEN}Integration tests passed on attempt $i!${NC}"
    rm -rf "$TEST_DIR"
    exit 0
  else
    echo -e "${RED}Integration tests failed on attempt $i.${NC}"
    if [ $i -lt $MAX_RETRIES ]; then
      echo -e "${YELLOW}Waiting $RETRY_DELAY seconds before next attempt...${NC}"
      sleep "$RETRY_DELAY"
    fi
  fi
done

echo -e "${RED}Integration tests failed after $MAX_RETRIES attempts.${NC}"
rm -rf "$TEST_DIR"
exit 1 
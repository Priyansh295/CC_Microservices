const axios = require('axios');
const { performance } = require('perf_hooks');
const chalk = require('chalk');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '5000');
const USE_MOCK_LOGIN = (process.env.USE_MOCK_LOGIN || 'true') === 'true';

// Helper function for colorized output
const log = {
  info: (message) => console.log(chalk.blue(`[INFO] ${message}`)),
  success: (message) => console.log(chalk.green(`[SUCCESS] ${message}`)),
  error: (message) => console.log(chalk.red(`[ERROR] ${message}`)),
  warning: (message) => console.log(chalk.yellow(`[WARNING] ${message}`))
};

// Mock auth token for testing
const MOCK_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MzI0NzYwMDAsImV4cCI6MTk0NzgzNjAwMH0.MXvVMJaUvfxBFHv82h1HQw_Bh_Y-5YJl8DNC4K9K6Ho';

// Services to test
const services = [
  { name: 'API Gateway', endpoint: '/' },
  { name: 'Authentication Service', endpoint: '/auth/health' },
  { name: 'Access Control Service', endpoint: '/access-control/health' },
  { name: 'RBAC Service', endpoint: '/rbac/health' },
  { name: 'Vulnerability Scanner', endpoint: '/vulnerability-scanner/health' },
  { name: 'Bug Monitoring', endpoint: '/bug-monitoring/health' },
  { name: 'Data Encryption', endpoint: '/encryption/health' }
];

// Utility function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry mechanism for API calls
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  try {
    const startTime = performance.now();
    const response = await axios(url, options);
    const endTime = performance.now();
    
    return {
      success: true,
      data: response.data,
      status: response.status,
      responseTime: Math.round(endTime - startTime)
    };
  } catch (error) {
    if (retries <= 0) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 'ERROR'
      };
    }
    
    log.warning(`Request to ${url} failed. Retrying in ${RETRY_DELAY}ms... (${retries} attempts left)`);
    await sleep(RETRY_DELAY);
    return fetchWithRetry(url, options, retries - 1);
  }
}

// Health check for all services
async function healthCheckAll() {
  log.info('Starting health checks for all services...');
  let allPassed = true;
  
  for (const service of services) {
    const url = `${BASE_URL}${service.endpoint}`;
    log.info(`Testing ${service.name} at ${url}`);
    
    const result = await fetchWithRetry(url);
    
    if (result.success) {
      log.success(`${service.name} is healthy (${result.responseTime}ms)`);
    } else {
      log.error(`${service.name} health check failed: ${result.error}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Authentication tests
async function testAuthentication() {
  log.info('Running authentication tests...');
  
  if (USE_MOCK_LOGIN) {
    log.info('Using mock login token for auth tests');
    return true;
  }
  
  // Login test
  const loginResult = await fetchWithRetry(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      username: 'testuser',
      password: 'testpassword'
    }
  });
  
  if (!loginResult.success) {
    log.error(`Login test failed: ${loginResult.error}`);
    return false;
  }
  
  log.success('Login test passed, token received');
  const authToken = loginResult.data.token;
  
  // Token validation test
  const validationResult = await fetchWithRetry(`${BASE_URL}/auth/validate-token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!validationResult.success) {
    log.error(`Token validation test failed: ${validationResult.error}`);
    return false;
  }
  
  log.success('Token validation test passed');
  return true;
}

// Access control tests
async function testAccessControl() {
  log.info('Running access control tests...');
  const token = USE_MOCK_LOGIN ? MOCK_AUTH_TOKEN : await getAuthToken();
  
  // Test permission check
  const permissionResult = await fetchWithRetry(`${BASE_URL}/access-control/check-permission`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: {
      resource: 'testResource',
      action: 'read'
    }
  });
  
  if (!permissionResult.success) {
    log.error(`Permission check test failed: ${permissionResult.error}`);
    return false;
  }
  
  log.success('Access control permission test passed');
  return true;
}

// Vulnerability scanner tests
async function testVulnerabilityScanner() {
  log.info('Running vulnerability scanner tests...');
  const token = USE_MOCK_LOGIN ? MOCK_AUTH_TOKEN : await getAuthToken();
  
  // Test basic scan
  const scanResult = await fetchWithRetry(`${BASE_URL}/vulnerability-scanner/scan-status`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!scanResult.success) {
    log.error(`Vulnerability scanner test failed: ${scanResult.error}`);
    return false;
  }
  
  log.success('Vulnerability scanner test passed');
  return true;
}

// Bug monitoring tests
async function testBugMonitoring() {
  log.info('Running bug monitoring tests...');
  const token = USE_MOCK_LOGIN ? MOCK_AUTH_TOKEN : await getAuthToken();
  
  // Test bug reporting
  const reportResult = await fetchWithRetry(`${BASE_URL}/bug-monitoring/report-status`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!reportResult.success) {
    log.error(`Bug monitoring test failed: ${reportResult.error}`);
    return false;
  }
  
  log.success('Bug monitoring test passed');
  return true;
}

// Data encryption tests
async function testDataEncryption() {
  log.info('Running data encryption tests...');
  const token = USE_MOCK_LOGIN ? MOCK_AUTH_TOKEN : await getAuthToken();
  
  // Test encryption status
  const encryptionResult = await fetchWithRetry(`${BASE_URL}/encryption/status`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!encryptionResult.success) {
    log.error(`Data encryption test failed: ${encryptionResult.error}`);
    return false;
  }
  
  log.success('Data encryption test passed');
  return true;
}

// Helper function to get auth token
async function getAuthToken() {
  log.info('Getting authentication token...');
  const loginResult = await fetchWithRetry(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      username: 'testuser',
      password: 'testpassword'
    }
  });
  
  if (!loginResult.success) {
    log.error(`Failed to get auth token: ${loginResult.error}`);
    return null;
  }
  
  return loginResult.data.token;
}

// Run all tests
async function runTests() {
  console.log(chalk.bold.blue('\n=== MICROSERVICES INTEGRATION TESTS ===\n'));
  
  const startTime = performance.now();
  let testsStatus = true;
  
  // Service health checks
  const healthChecksResult = await healthCheckAll();
  if (!healthChecksResult) {
    log.error('Health checks failed for one or more services');
    testsStatus = false;
  }
  
  // Authentication tests
  const authResult = await testAuthentication();
  if (!authResult) {
    log.error('Authentication tests failed');
    testsStatus = false;
  }
  
  // Access control tests
  const accessControlResult = await testAccessControl();
  if (!accessControlResult) {
    log.error('Access control tests failed');
    testsStatus = false;
  }
  
  // Vulnerability scanner tests
  const vulnerabilityResult = await testVulnerabilityScanner();
  if (!vulnerabilityResult) {
    log.error('Vulnerability scanner tests failed');
    testsStatus = false;
  }
  
  // Bug monitoring tests
  const bugMonitoringResult = await testBugMonitoring();
  if (!bugMonitoringResult) {
    log.error('Bug monitoring tests failed');
    testsStatus = false;
  }
  
  // Data encryption tests
  const encryptionResult = await testDataEncryption();
  if (!encryptionResult) {
    log.error('Data encryption tests failed');
    testsStatus = false;
  }
  
  const endTime = performance.now();
  const testDuration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(chalk.bold.blue('\n=== TEST SUMMARY ==='));
  console.log(`Total test duration: ${testDuration} seconds`);
  
  if (testsStatus) {
    console.log(chalk.bold.green('\n✅ ALL TESTS PASSED'));
    process.exit(0);
  } else {
    console.log(chalk.bold.red('\n❌ SOME TESTS FAILED'));
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 
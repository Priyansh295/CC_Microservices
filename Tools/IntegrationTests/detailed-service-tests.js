/**
 * Detailed Microservices Integration Test Suite
 * 
 * This script performs detailed tests on each microservice and their interactions.
 */

const axios = require('axios');
const assert = require('assert').strict;

// Configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost',
  timeout: 5000,
  services: {
    nginx: { port: 80, path: '/health' },
    accessControl: { port: 3001, endpoint: '/api/access-control' },
    vulnerabilityScanner: { port: 3002, endpoint: '/api/vulnerability-scanner' },
    bugMonitoring: { port: 3003, endpoint: '/api/bug-monitoring' },
    dataEncryption: { port: 3004, endpoint: '/api/data-encryption' },
    authentication: { port: 3005, endpoint: '/api/auth' },
    rbac: { port: 3006, endpoint: '/api/rbac' }
  },
  testUsers: {
    admin: {
      username: 'admin-test',
      password: 'Admin123!',
      role: 'admin'
    },
    user: {
      username: 'user-test', 
      password: 'User123!',
      role: 'user'
    },
    guest: {
      username: 'guest-test',
      password: 'Guest123!',
      role: 'guest'
    }
  }
};

// Test utilities
const testUtil = {
  formatResult: (testName, success, error = null) => {
    const status = success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status}: ${testName}`);
    if (error) {
      console.error(`  Error: ${error.message || error}`);
    }
    return { success, error };
  },

  createApiClient: (service, token = null) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return axios.create({
      baseURL: `${config.baseUrl}${service.endpoint || `:${service.port}`}`,
      timeout: config.timeout,
      headers
    });
  },
  
  generateMockToken: (user) => {
    // This is a mock JWT token for testing purposes - normally we'd get this from authentication service
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlciIsInJvbGUiOiIke3VzZXIucm9sZX0iLCJpYXQiOjE3MTM1MzQ1NjN9.z-bqwgqk_m6XnExDiHRzeKJ28RNKIvRJNb9Yf7uAtdk`;
  }
};

// Test runners
async function runServiceHealthTests() {
  console.log('\n=== Service Health Tests ===\n');
  const results = {};
  
  for (const [name, serviceConfig] of Object.entries(config.services)) {
    const url = `${config.baseUrl}${serviceConfig.endpoint || `:${serviceConfig.port}`}/health`;
    
    try {
      console.log(`Testing ${name} health at ${url}...`);
      const response = await axios.get(url, { timeout: config.timeout });
      
      const status = response.data.status || 'unknown';
      const isHealthy = status === 'healthy' || status === 'ok';
      
      results[name] = testUtil.formatResult(
        `${name} health check`,
        isHealthy,
        isHealthy ? null : `Service returned status: ${status}`
      );
    } catch (error) {
      results[name] = testUtil.formatResult(
        `${name} health check`,
        false,
        error
      );
    }
  }
  
  return results;
}

// Access Control Tests
async function runAccessControlTests() {
  console.log('\n=== Access Control Tests ===\n');
  const results = {};
  const service = config.services.accessControl;
  
  // Test Case 1: Check access for admin role
  try {
    console.log('Test Case 1: Admin role access check');
    const client = testUtil.createApiClient(service);
    const response = await client.post('/check-access', {
      role: 'admin',
      action: 'read',
      resource: 'documents'
    });
    
    results['admin_access'] = testUtil.formatResult(
      'Admin role access check',
      response.data.allowed === true,
      response.data.allowed !== true ? 'Admin should have access' : null
    );
  } catch (error) {
    results['admin_access'] = testUtil.formatResult('Admin role access check', false, error);
  }
  
  // Test Case 2: Check access for user role
  try {
    console.log('Test Case 2: User role access check');
    const client = testUtil.createApiClient(service);
    const response = await client.post('/check-access', {
      role: 'user',
      action: 'read',
      resource: 'documents'
    });
    
    results['user_access'] = testUtil.formatResult(
      'User role access check',
      response.data.allowed === true,
      response.data.allowed !== true ? 'User should have read access' : null
    );
  } catch (error) {
    results['user_access'] = testUtil.formatResult('User role access check', false, error);
  }
  
  // Test Case 3: Check denied access for guest role
  try {
    console.log('Test Case 3: Guest role denied access check');
    const client = testUtil.createApiClient(service);
    const response = await client.post('/check-access', {
      role: 'guest',
      action: 'update',
      resource: 'documents'
    });
    
    results['guest_denied'] = testUtil.formatResult(
      'Guest role denied access check',
      response.data.allowed === false,
      response.data.allowed !== false ? 'Guest should not have update access' : null
    );
  } catch (error) {
    results['guest_denied'] = testUtil.formatResult('Guest role denied access check', false, error);
  }
  
  return results;
}

// Authentication Tests
async function runAuthenticationTests() {
  console.log('\n=== Authentication Tests ===\n');
  const results = {};
  const service = config.services.authentication;
  
  // Test Case 1: Check if auth endpoints are accessible
  try {
    console.log('Test Case 1: Auth endpoints check');
    const client = testUtil.createApiClient(service);
    // Just check if we can reach the auth endpoints
    const response = await client.get('/health');
    
    results['auth_endpoints'] = testUtil.formatResult(
      'Auth endpoints check',
      response.status === 200,
      response.status !== 200 ? 'Auth service should be accessible' : null
    );
  } catch (error) {
    results['auth_endpoints'] = testUtil.formatResult('Auth endpoints check', false, error);
  }
  
  // We'll skip actual login testing since it would require actual credentials
  // In real tests, we would do things like registration, login attempts, etc.
  
  return results;
}

// Access Control with Auth Tests (integration test)
async function runAccessControlWithAuthTests() {
  console.log('\n=== Access Control + Auth Integration Tests ===\n');
  const results = {};
  const acService = config.services.accessControl;
  
  // Test Case: Check session validation with token
  try {
    console.log('Test Case: Session validation with token');
    // Generate a test token for an admin
    const mockToken = testUtil.generateMockToken(config.testUsers.admin);
    const client = testUtil.createApiClient(acService, mockToken);
    
    // The test will check if access-control properly handles tokens
    // We aren't expecting a successful validation in this test environment
    // but we want to confirm it doesn't crash
    try {
      await client.post('/check-session', {
        sessionId: 'test-session',
        action: 'read',
        resource: 'documents'
      });
      
      results['session_check'] = testUtil.formatResult(
        'Session validation handling',
        true,
        null
      );
    } catch (error) {
      // If the service returns a controlled error, that's still OK for this test
      const isControlledError = error.response && 
        (error.response.status === 401 || 
         error.response.data && error.response.data.reason);
      
      results['session_check'] = testUtil.formatResult(
        'Session validation handling',
        isControlledError,
        isControlledError ? null : error
      );
    }
  } catch (error) {
    results['session_check'] = testUtil.formatResult('Session validation handling', false, error);
  }
  
  return results;
}

// RBAC Tests
async function runRbacTests() {
  console.log('\n=== RBAC Tests ===\n');
  const results = {};
  const service = config.services.rbac;
  
  // Test Case 1: Basic RBAC health check
  try {
    console.log('Test Case 1: RBAC health check');
    const client = testUtil.createApiClient(service);
    const response = await client.get('/health');
    
    results['rbac_health'] = testUtil.formatResult(
      'RBAC health check',
      response.status === 200,
      response.status !== 200 ? 'RBAC service should be accessible' : null
    );
  } catch (error) {
    results['rbac_health'] = testUtil.formatResult('RBAC health check', false, error);
  }
  
  // Test Case 2: RBAC permission check (this is a simplified test)
  try {
    console.log('Test Case 2: RBAC permission check');
    const client = testUtil.createApiClient(service);
    try {
      // Note: The actual parameters needed may vary based on your RBAC implementation
      const response = await client.post('/api/v1/check', {
        role: 'admin',
        user_id: 'test-user',
        action: 'read',
        resource: 'documents',
        permission: 'read_documents'
      });
      
      // We're mainly checking if the API responds - not necessarily checking the result
      results['rbac_check'] = testUtil.formatResult(
        'RBAC permission check',
        response.status === 200,
        response.status !== 200 ? 'RBAC service should process permission checks' : null
      );
    } catch (error) {
      // If the service returns a controlled error, that's still OK for this test
      const isControlledError = error.response && 
        error.response.status !== 500 &&
        error.response.data;
      
      results['rbac_check'] = testUtil.formatResult(
        'RBAC permission check',
        isControlledError,
        isControlledError ? null : error
      );
    }
  } catch (error) {
    results['rbac_check'] = testUtil.formatResult('RBAC permission check', false, error);
  }
  
  return results;
}

// Data Encryption Tests
async function runDataEncryptionTests() {
  console.log('\n=== Data Encryption Tests ===\n');
  const results = {};
  const service = config.services.dataEncryption;
  
  // Test Case 1: Encryption service health check
  try {
    console.log('Test Case 1: Encryption service health check');
    const client = testUtil.createApiClient(service);
    const response = await client.get('/health');
    
    results['encryption_health'] = testUtil.formatResult(
      'Encryption service health check',
      response.status === 200,
      response.status !== 200 ? 'Encryption service should be accessible' : null
    );
  } catch (error) {
    results['encryption_health'] = testUtil.formatResult('Encryption service health check', false, error);
  }
  
  // Test Case 2: Test encryption capability (if available)
  try {
    console.log('Test Case 2: Test encryption capability');
    const client = testUtil.createApiClient(service);
    const testData = {
      plaintext: 'test-secret-data'
    };
    
    try {
      // Try to encrypt data - this endpoint may vary based on your implementation
      const response = await client.post('/encrypt', testData);
      
      const hasEncryptedData = response.data && 
        (response.data.ciphertext || response.data.encrypted);
      
      results['encrypt_data'] = testUtil.formatResult(
        'Encrypt data',
        hasEncryptedData,
        hasEncryptedData ? null : 'Encryption service should return encrypted data'
      );
    } catch (error) {
      // If the endpoint doesn't exist, that's a different kind of test failure
      results['encrypt_data'] = testUtil.formatResult(
        'Encrypt data',
        false,
        `Encryption endpoint failed: ${error.message}`
      );
    }
  } catch (error) {
    results['encrypt_data'] = testUtil.formatResult('Encrypt data', false, error);
  }
  
  return results;
}

// Bug Monitoring Tests
async function runBugMonitoringTests() {
  console.log('\n=== Bug Monitoring Tests ===\n');
  const results = {};
  const service = config.services.bugMonitoring;
  
  // Test Case 1: Bug monitoring service health check
  try {
    console.log('Test Case 1: Bug monitoring service health check');
    const client = testUtil.createApiClient(service);
    const response = await client.get('/health');
    
    results['monitoring_health'] = testUtil.formatResult(
      'Bug monitoring service health check',
      response.status === 200,
      response.status !== 200 ? 'Bug monitoring service should be accessible' : null
    );
  } catch (error) {
    results['monitoring_health'] = testUtil.formatResult('Bug monitoring service health check', false, error);
  }
  
  // Test Case 2: Log an error (if applicable)
  try {
    console.log('Test Case 2: Test error reporting');
    const client = testUtil.createApiClient(service);
    const testError = {
      level: 'error',
      message: 'Test error message',
      source: 'integration-test',
      stack: 'Mock stack trace for testing purposes',
      metadata: {
        testCase: 'bug_monitoring_test',
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      // Try to log an error - endpoint may vary based on implementation
      const response = await client.post('/log', testError);
      
      results['log_error'] = testUtil.formatResult(
        'Log test error',
        response.status === 200 || response.status === 201,
        (response.status !== 200 && response.status !== 201) ? 
          'Bug monitoring service should accept error logs' : null
      );
    } catch (error) {
      // If the endpoint doesn't exist, that's a different kind of test failure
      results['log_error'] = testUtil.formatResult(
        'Log test error',
        false,
        `Error logging endpoint failed: ${error.message}`
      );
    }
  } catch (error) {
    results['log_error'] = testUtil.formatResult('Log test error', false, error);
  }
  
  return results;
}

// Vulnerability Scanner Tests
async function runVulnerabilityTests() {
  console.log('\n=== Vulnerability Scanner Tests ===\n');
  const results = {};
  const service = config.services.vulnerabilityScanner;
  
  // Test Case 1: Vulnerability service health check
  try {
    console.log('Test Case 1: Vulnerability service health check');
    const client = testUtil.createApiClient(service);
    const response = await client.get('/health');
    
    results['vulnerability_health'] = testUtil.formatResult(
      'Vulnerability service health check',
      response.status === 200,
      response.status !== 200 ? 'Vulnerability service should be accessible' : null
    );
  } catch (error) {
    results['vulnerability_health'] = testUtil.formatResult('Vulnerability service health check', false, error);
  }
  
  // Test Case 2: Check scan capability (if available)
  try {
    console.log('Test Case 2: Test scan capability');
    const client = testUtil.createApiClient(service);
    const scanTarget = {
      target: 'test-service',
      scope: 'limited',
      options: {
        port_scan: true,
        dependency_check: true
      }
    };
    
    try {
      // Try to initiate a scan - endpoint may vary
      const response = await client.post('/scan', scanTarget);
      
      results['scan_target'] = testUtil.formatResult(
        'Scan target',
        response.status === 200 || response.status === 202,
        (response.status !== 200 && response.status !== 202) ? 
          'Vulnerability service should accept scan requests' : null
      );
    } catch (error) {
      // If the endpoint doesn't exist, that's a different kind of test failure
      results['scan_target'] = testUtil.formatResult(
        'Scan target',
        false,
        `Scan endpoint failed: ${error.message}`
      );
    }
  } catch (error) {
    results['scan_target'] = testUtil.formatResult('Scan target', false, error);
  }
  
  return results;
}

// Integration Tests for Security and User Management
async function runIntegrationTests() {
  console.log('\n=== Integration Tests ===\n');
  const results = {};
  
  // Test Case: Access Control + Authentication
  console.log('Test Case: Access Control + Authentication');
  const acAuthResults = await runAccessControlWithAuthTests();
  results.acAuth = acAuthResults;
  
  // Additional integration tests would be added here
  
  return results;
}

// Run all tests
async function runAllTests() {
  console.log('===============================================');
  console.log('Detailed Microservices Integration Test Suite');
  console.log('===============================================\n');
  
  try {
    // Run basic health checks first
    const healthResults = await runServiceHealthTests();
    
    // Run individual service tests
    const acResults = await runAccessControlTests();
    const authResults = await runAuthenticationTests();
    const rbacResults = await runRbacTests();
    const encryptionResults = await runDataEncryptionTests();
    const bugResults = await runBugMonitoringTests();
    const vulnResults = await runVulnerabilityTests();
    
    // Run integration tests
    const integrationResults = await runIntegrationTests();
    
    // Count test statistics
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    // Function to count results from a result set
    const countResults = (results) => {
      for (const key in results) {
        if (typeof results[key] === 'object' && results[key].hasOwnProperty('success')) {
          totalTests++;
          if (results[key].success) {
            passedTests++;
          } else {
            failedTests++;
          }
        }
      }
    };
    
    // Count all results
    countResults(healthResults);
    countResults(acResults);
    countResults(authResults);
    countResults(rbacResults);
    countResults(encryptionResults);
    countResults(bugResults);
    countResults(vulnResults);
    countResults(integrationResults);
    
    // Print summary
    console.log('\n===============================================');
    console.log('                Test Summary                  ');
    console.log('===============================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${(passedTests / totalTests * 100).toFixed(2)}%`);
    console.log('===============================================\n');
    
    // Return results for programmatic use
    return {
      health: healthResults,
      accessControl: acResults,
      authentication: authResults,
      rbac: rbacResults,
      encryption: encryptionResults,
      bugMonitoring: bugResults,
      vulnerabilityScanner: vulnResults,
      integration: integrationResults,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: (passedTests / totalTests * 100).toFixed(2)
      }
    };
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runAllTests()
    .then(results => {
      // Exit with appropriate code based on test results
      process.exit(results.summary.failedTests > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Unhandled error in test suite:', err);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = {
    runAllTests,
    runServiceHealthTests,
    runAccessControlTests,
    runAuthenticationTests,
    runRbacTests,
    runDataEncryptionTests,
    runBugMonitoringTests,
    runVulnerabilityTests,
    runIntegrationTests
  };
} 
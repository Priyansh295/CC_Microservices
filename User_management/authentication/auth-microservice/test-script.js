// Comprehensive Microservices Integration Test Script - Node.js version
const axios = require('axios');

// Configuration
const CONFIG = {
  AUTH_URL: "http://localhost:3001/api/auth",  // Root auth URL
  ACCESS_CONTROL_URL: "http://localhost:3001/api/access-control",
  DATA_ENCRYPTION_URL: "http://localhost:3001/api/data-encryption",
  VULNERABILITY_SCANNER_URL: "http://localhost:3001/api/vulnerability-scanner",
  BUG_MONITORING_URL: "http://localhost:3001/api/bug-monitoring",

  // Health check URLs
  HEALTH_CHECKS: {
    AUTH: "http://localhost:3001/api/auth/health",
    ACCESS_CONTROL: "http://localhost:3001/api/access-control/health",
    DATA_ENCRYPTION: "http://localhost:3001/api/data-encryption/health", 
    VULNERABILITY_SCANNER: "http://localhost:3001/api/vulnerability-scanner/health",
    BUG_MONITORING: "http://localhost:3001/api/bug-monitoring/health"
  },

  // Test credentials - updated to match the test users we've created
  USER_CREDENTIALS: {
    email: "test@example.com",
    password: "password123"
  },
  ADMIN_CREDENTIALS: {
    email: "admin@example.com",
    password: "admin123"
  },
  BAD_CREDENTIALS: {
    email: "nonexistent@example.com",
    password: "wrongpassword"
  }
};

// Text styling functions
function writeTitle(text) {
  console.log(`\n\n========== ${text} ==========`);
}

function writeSectionTitle(text) {
  console.log(`\n--- ${text} ---`);
}

function writeSuccess(text) {
  console.log(`✅ ${text}`);
}

function writeError(text) {
  console.log(`❌ ${text}`);
}

function writeInfo(text) {
  console.log(`ℹ️ ${text}`);
}

// Helper Functions
async function testServiceHealth(serviceName, url) {
  writeSectionTitle(`Testing ${serviceName} Health`);
  
  try {
    const response = await axios.get(url);
    writeSuccess(`${serviceName} is healthy: ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    writeError(`${serviceName} health check failed: ${error.message}`);
    if (error.response) {
      writeError(`Status code: ${error.response.status}`);
    }
    return false;
  }
}

async function testAuthentication(credentials, testName) {
  writeSectionTitle(`Testing Authentication: ${testName}`);
  
  try {
    const response = await axios.post(`${CONFIG.AUTH_URL}/login`, credentials);
    writeSuccess("Authentication successful");
    console.log(`User: ${response.data.user.email}, Role: ${response.data.user.role}`);
    return response.data;
  } catch (error) {
    writeError(`Authentication failed: ${error.message}`);
    if (error.response) {
      writeError(`Status code: ${error.response.status}`);
      try {
        writeError(`Error details: ${JSON.stringify(error.response.data)}`);
      } catch (e) {
        // If we can't parse the error as JSON, just show the raw error
        writeError(`Error details: ${error.response.data}`);
      }
    }
    return null;
  }
}

async function testAccessControl(token, role, action, resource, testName) {
  writeSectionTitle(`Testing Access Control: ${testName}`);
  
  // First test check-session with token
  if (token) {
    try {
      const sessionBody = {
        sessionId: `test-session-${Date.now()}`,
        action,
        resource
      };
      
      const sessionResponse = await axios.post(
        `${CONFIG.ACCESS_CONTROL_URL}/check-session`,
        sessionBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      writeInfo(`Session check response: ${JSON.stringify(sessionResponse.data)}`);
    } catch (error) {
      writeError(`Session check failed: ${error.message}`);
    }
  }
  
  // Then test direct role-based access
  try {
    const accessBody = {
      role,
      action,
      resource,
      userId: "test-user",
      ownerId: (action === "update" || action === "delete") ? "test-user" : null
    };
    
    const accessResponse = await axios.post(
      `${CONFIG.ACCESS_CONTROL_URL}/check-access`,
      accessBody
    );
    
    if (accessResponse.data.allowed) {
      writeSuccess(`Access allowed for role '${role}' to '${action}' on '${resource}'`);
    } else {
      writeInfo(`Access denied for role '${role}' to '${action}' on '${resource}'`);
    }
    
    return accessResponse.data;
  } catch (error) {
    writeError(`Access control check failed: ${error.message}`);
    return null;
  }
}

async function testDataEncryption(testName, plainText) {
  writeSectionTitle(`Testing Data Encryption: ${testName}`);
  
  try {
    // Test encryption
    const encryptResponse = await axios.post(
      `${CONFIG.DATA_ENCRYPTION_URL}/encrypt`,
      { plaintext: plainText }
    );
    
    writeSuccess("Data encrypted successfully");
    
    // Test decryption
    const decryptResponse = await axios.post(
      `${CONFIG.DATA_ENCRYPTION_URL}/decrypt`,
      { encrypted: encryptResponse.data.encrypted }
    );
    
    writeSuccess("Data decrypted successfully");
    
    // Verify decryption result
    if (decryptResponse.data.decrypted === plainText) {
      writeSuccess("Encryption/Decryption verified: Original text recovered");
    } else {
      writeError("Decryption verification failed: Texts do not match");
      writeError(`Original: ${plainText}`);
      writeError(`Decrypted: ${decryptResponse.data.decrypted}`);
    }
    
    return {
      success: true,
      encrypted: encryptResponse.data.encrypted,
      decrypted: decryptResponse.data.decrypted
    };
  } catch (error) {
    writeError(`Data encryption/decryption failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testVulnerabilityScanner(url, testName) {
  writeSectionTitle(`Testing Vulnerability Scanner: ${testName}`);
  
  try {
    // Updated to use correct parameters
    const scanBody = {
      url,
      scan_type: "quick",
      content: "package.json content goes here",
      options: {
        include_dependencies: true,
        severity_level: "medium"
      }
    };
    
    // First check health
    try {
      const healthResponse = await axios.get(`${CONFIG.HEALTH_CHECKS.VULNERABILITY_SCANNER}`);
      writeInfo(`Vulnerability Scanner health: ${JSON.stringify(healthResponse.data)}`);
    } catch (e) {
      writeError(`Health check failed: ${e.message}`);
    }
    
    // Then attempt the scan
    const scanResponse = await axios.post(
      `${CONFIG.VULNERABILITY_SCANNER_URL}/scan`,
      scanBody
    );
    
    writeSuccess(`Vulnerability scan initiated: ${JSON.stringify(scanResponse.data)}`);
    return scanResponse.data;
  } catch (error) {
    writeError(`Vulnerability scan failed: ${error.message}`);
    // Check if we can just return the service health as a fallback
    try {
      const healthResponse = await axios.get(`${CONFIG.HEALTH_CHECKS.VULNERABILITY_SCANNER}`);
      writeInfo(`Service is healthy but scan failed. Health: ${JSON.stringify(healthResponse.data)}`);
      return { status: "health_check_only", service: "healthy" };
    } catch (e) {
      writeError(`Health check also failed: ${e.message}`);
      return null;
    }
  }
}

async function testBugMonitoring(serviceName, testName) {
  writeSectionTitle(`Testing Bug Monitoring: ${testName}`);
  
  try {
    // Check if the endpoint exists first
    const infoResponse = await axios.get(`${CONFIG.BUG_MONITORING_URL}/`);
    
    // Find the available endpoints from the info response
    let availableEndpoints = [];
    if (infoResponse.data.endpoints) {
      availableEndpoints = infoResponse.data.endpoints;
    }
    
    // Use the correct endpoint based on what's available
    const reportEndpoint = "report";  // Default to report
    
    writeInfo(`Using bug monitoring endpoint: /${reportEndpoint}`);
    
    const reportBody = {
      service: serviceName,
      description: "Test bug report from integration test script",
      severity: "low",
      test_mode: true,
      timestamp: new Date().toISOString(),
      reporter: "test-script",
      issue_type: "test"
    };
    
    const reportResponse = await axios.post(
      `${CONFIG.BUG_MONITORING_URL}/${reportEndpoint}`,
      reportBody
    );
    
    writeSuccess(`Bug report submitted: ${JSON.stringify(reportResponse.data)}`);
    return reportResponse.data;
  } catch (error) {
    writeError(`Bug report submission failed: ${error.message}`);
    // Try health check as fallback
    try {
      const healthResponse = await axios.get(`${CONFIG.HEALTH_CHECKS.BUG_MONITORING}`);
      writeInfo(`Service is healthy but report submission failed. Health: ${JSON.stringify(healthResponse.data)}`);
      return { status: "health_check_only", service: "healthy" };
    } catch (e) {
      writeError(`Health check also failed: ${e.message}`);
      return null;
    }
  }
}

async function testIntegrationScenario(scenarioName, credentials, role, accessTests) {
  writeTitle(`Scenario: ${scenarioName}`);
  
  // Step 1: Authentication
  const authResult = await testAuthentication(credentials, `${scenarioName} - Login`);
  
  if (!authResult) {
    writeError("Scenario failed at authentication stage");
    return;
  }
  
  const token = authResult.token;
  const actualRole = authResult.user.role;
  
  // Step 2: Check if role matches expected
  if (actualRole === role) {
    writeSuccess(`User has expected role: ${role}`);
  } else {
    writeError(`User role mismatch - Expected: ${role}, Actual: ${actualRole}`);
  }
  
  // Step 3: Test various access permissions
  for (const [action, resource] of Object.entries(accessTests)) {
    await testAccessControl(token, actualRole, action, resource, `${scenarioName} - ${action} ${resource}`);
  }
  
  // Step 4: Test encryption with user-specific data
  const encryptionData = `Sensitive data for ${credentials.email} with role ${actualRole}`;
  const encryptResult = await testDataEncryption(`${scenarioName} - Encryption`, encryptionData);
  
  // Step 5: Test vulnerability scanning
  const scanResult = await testVulnerabilityScanner("http://localhost:3001/api/auth", `${scenarioName} - Auth Endpoint`);
  
  // Step 6: Test bug monitoring
  const bugResult = await testBugMonitoring("authentication", `${scenarioName} - Auth Service`);
  
  console.log("\n");
  writeInfo(`Scenario ${scenarioName} completed`);
}

// Main test execution
async function runTests() {
  writeTitle("Starting Comprehensive Integration Tests");

  // Check if all services are healthy
  const servicesHealth = [
    await testServiceHealth("Authentication", CONFIG.HEALTH_CHECKS.AUTH),
    await testServiceHealth("Access Control", CONFIG.HEALTH_CHECKS.ACCESS_CONTROL),
    await testServiceHealth("Data Encryption", CONFIG.HEALTH_CHECKS.DATA_ENCRYPTION),
    await testServiceHealth("Vulnerability Scanner", CONFIG.HEALTH_CHECKS.VULNERABILITY_SCANNER),
    await testServiceHealth("Bug Monitoring", CONFIG.HEALTH_CHECKS.BUG_MONITORING)
  ];

  const allHealthy = !servicesHealth.includes(false);

  if (!allHealthy) {
    writeError("Some services are not healthy. Test results may be incomplete.");
  } else {
    writeSuccess("All services are healthy.");
  }

  // Test Scenario 1: Standard User
  await testIntegrationScenario(
    "Standard User Operations",
    CONFIG.USER_CREDENTIALS,
    "user",
    {
      "read": "documents",
      "create": "documents",
      "update": "documents",
      "delete": "documents"
    }
  );

  // Test Scenario 2: Admin User
  await testIntegrationScenario(
    "Admin User Operations",
    CONFIG.ADMIN_CREDENTIALS,
    "admin",
    {
      "read": "users",
      "create": "users",
      "update": "system",
      "delete": "documents"
    }
  );

  // Test Scenario 3: Failed Login
  writeTitle("Scenario: Failed Authentication");
  const failedAuth = await testAuthentication(CONFIG.BAD_CREDENTIALS, "Invalid Credentials");

  if (!failedAuth) {
    writeSuccess("Authentication correctly failed for invalid credentials");
  } else {
    writeError("Authentication unexpectedly succeeded for invalid credentials");
  }

  // Test Scenario 4: Direct Data Encryption (No Auth Required)
  writeTitle("Scenario: Direct Data Encryption");
  const sensitiveData = [
    "Credit Card: 4111-1111-1111-1111",
    "Social Security Number: 123-45-6789",
    "Password: SuperSecretP@ssw0rd!"
  ];

  for (const data of sensitiveData) {
    await testDataEncryption("Sensitive Data Encryption", data);
  }

  writeTitle("Test Suite Completed");
}

// Run the tests
runTests().catch(console.error); 
const axios = require('axios');

// Configuration
const AUTH_URL = 'http://localhost/api/auth/api/auth';
const ACCESS_CONTROL_URL = 'http://localhost/api/access-control';
const DATA_ENCRYPTION_URL = 'http://localhost/api/data-encryption';

// Test user credentials - these should be updated with valid credentials if possible
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// Set axios timeout to avoid hanging
axios.defaults.timeout = 5000;

// Main test function
async function runTests() {
  console.log('Starting Authentication and Security Services Integration Tests');
  console.log('--------------------------------------------------------');
  
  try {
    // Step 1: Check if services are running
    console.log('\n1. Checking if services are healthy...');
    const servicesHealthy = await checkServiceHealth();
    
    if (!servicesHealthy) {
      console.error('❌ Some services are not healthy. Proceeding with caution.');
    } else {
      console.log('✅ All services are healthy!');
    }
    
    // Step 2: Login and get token
    console.log('\n2. Testing authentication...');
    const authToken = await authenticate();
    
    if (!authToken) {
      console.error('❌ Failed to authenticate. Skipping remaining tests that require authentication.');
      // Continue with tests that don't require authentication
    } else {
      console.log(`✅ Authentication successful! Token received.`);
      
      // Step 3: Test access control with the token
      console.log('\n3. Testing access control with auth token...');
      await testAccessControl(authToken);
    }
    
    // Step 4: Test data encryption service (doesn't require authentication)
    console.log('\n4. Testing data encryption service...');
    await testDataEncryption();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Tests failed with unhandled error:', error.message);
    console.error(error.stack);
  }
}

// Check if services are healthy
async function checkServiceHealth() {
  let allHealthy = true;
  
  try {
    const authHealth = await axios.get(`http://localhost/api/auth/health`);
    console.log(`✅ Authentication service: ${JSON.stringify(authHealth.data)}`);
  } catch (error) {
    console.error(`❌ Authentication service: ${error.message}`);
    if (error.response) {
      console.error(`  Response: ${JSON.stringify(error.response.data)}`);
    }
    allHealthy = false;
  }
  
  try {
    const accessControlHealth = await axios.get(`${ACCESS_CONTROL_URL}/health`);
    console.log(`✅ Access Control service: ${JSON.stringify(accessControlHealth.data)}`);
  } catch (error) {
    console.error(`❌ Access Control service: ${error.message}`);
    if (error.response) {
      console.error(`  Response: ${JSON.stringify(error.response.data)}`);
    }
    allHealthy = false;
  }
  
  try {
    const dataEncryptionHealth = await axios.get(`${DATA_ENCRYPTION_URL}/health`);
    console.log(`✅ Data Encryption service: ${JSON.stringify(dataEncryptionHealth.data)}`);
  } catch (error) {
    console.error(`❌ Data Encryption service: ${error.message}`);
    if (error.response) {
      console.error(`  Response: ${JSON.stringify(error.response.data)}`);
    }
    allHealthy = false;
  }
  
  return allHealthy;
}

// Authenticate and get token
async function authenticate() {
  console.log(`Attempting to authenticate with email: ${TEST_USER.email}`);
  
  try {
    const response = await axios.post(`${AUTH_URL}/login`, TEST_USER);
    console.log('✅ Authentication response received');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
      console.error('  Status:', error.response.status);
    }
    return null;
  }
}

// Test access control with token
async function testAccessControl(token) {
  try {
    console.log(`Testing check-session endpoint with token: ${token.substring(0, 10)}...`);
    
    // Test check-session endpoint with token
    const sessionCheckResponse = await axios.post(
      `${ACCESS_CONTROL_URL}/check-session`,
      { sessionId: 'test-session', action: 'read', resource: 'documents' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Session check response:', JSON.stringify(sessionCheckResponse.data, null, 2));
    
    // Test access permissions
    console.log('Testing access permissions for role: user, action: read, resource: documents');
    const accessResponse = await axios.post(
      `${ACCESS_CONTROL_URL}/check-access`,
      { role: 'user', action: 'read', resource: 'documents' }
    );
    
    console.log('✅ Access check response:', JSON.stringify(accessResponse.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Access control test failed:', error.message);
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
      console.error('  Status:', error.response.status);
    }
    return false;
  }
}

// Test data encryption service
async function testDataEncryption() {
  try {
    const plaintext = 'This is a test message';
    console.log(`Testing encryption with plaintext: "${plaintext}"`);
    
    // Test encryption
    const encryptResponse = await axios.post(
      `${DATA_ENCRYPTION_URL}/encrypt`,
      { plaintext }
    );
    
    console.log('✅ Encryption response:', JSON.stringify(encryptResponse.data, null, 2));
    
    if (!encryptResponse.data.encrypted) {
      throw new Error('No encrypted data received from encryption service');
    }
    
    // Test decryption
    console.log(`Testing decryption with encrypted data: "${encryptResponse.data.encrypted.substring(0, 20)}..."`);
    const decryptResponse = await axios.post(
      `${DATA_ENCRYPTION_URL}/decrypt`,
      { encrypted: encryptResponse.data.encrypted }
    );
    
    console.log('✅ Decryption response:', JSON.stringify(decryptResponse.data, null, 2));
    
    // Verify decryption worked correctly
    if (decryptResponse.data.decrypted === plaintext) {
      console.log('✅ Decryption verified: Original text recovered successfully');
    } else {
      console.error('❌ Decryption verification failed: Texts do not match');
      console.error(`  Expected: "${plaintext}"`);
      console.error(`  Actual: "${decryptResponse.data.decrypted}"`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Data encryption test failed:', error.message);
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
      console.error('  Status:', error.response.status);
    }
    return false;
  }
}

// Run the tests
runTests(); 

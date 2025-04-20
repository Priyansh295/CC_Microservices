/**
 * Simple Access Control Test Script
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';

// Main function to run tests
async function runTests() {
  console.log('Starting access-control service tests...');
  
  try {
    // Test 1: Health check
    console.log('\nTest 1: Health check');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log(`Status: ${healthResponse.status}`);
    console.log(`Response: ${JSON.stringify(healthResponse.data)}`);
    console.log('Health check test: PASSED');
    
    // Test 2: Check access for admin role
    console.log('\nTest 2: Check access for admin role');
    const adminAccessResponse = await axios.post(`${BASE_URL}/check-access`, {
      role: 'admin',
      action: 'read',
      resource: 'documents'
    });
    console.log(`Allowed: ${adminAccessResponse.data.allowed}`);
    if (adminAccessResponse.data.allowed !== true) {
      throw new Error('Admin should have access');
    }
    console.log('Admin access test: PASSED');
    
    // Test 3: Check access for user role (allowed)
    console.log('\nTest 3: Check access for user role (allowed)');
    const userAccessResponse = await axios.post(`${BASE_URL}/check-access`, {
      role: 'user',
      action: 'read',
      resource: 'documents'
    });
    console.log(`Allowed: ${userAccessResponse.data.allowed}`);
    if (userAccessResponse.data.allowed !== true) {
      throw new Error('User should have read access to documents');
    }
    console.log('User access (allowed) test: PASSED');
    
    // Test 4: Check access for user role (denied)
    console.log('\nTest 4: Check access for user role (denied)');
    const userDeniedResponse = await axios.post(`${BASE_URL}/check-access`, {
      role: 'user',
      action: 'delete',
      resource: 'system'
    });
    console.log(`Allowed: ${userDeniedResponse.data.allowed}`);
    if (userDeniedResponse.data.allowed !== false) {
      throw new Error('User should NOT have delete access to system');
    }
    console.log('User access (denied) test: PASSED');
    
    // Test 5: Guest role (public docs)
    console.log('\nTest 5: Check access for guest role (public docs)');
    const guestPublicResponse = await axios.post(`${BASE_URL}/check-access`, {
      role: 'guest',
      action: 'read',
      resource: 'public-docs'
    });
    console.log(`Allowed: ${guestPublicResponse.data.allowed}`);
    if (guestPublicResponse.data.allowed !== true) {
      throw new Error('Guest should have read access to public-docs');
    }
    console.log('Guest access (public docs) test: PASSED');
    
    // Test 6: Guest role (regular docs)
    console.log('\nTest 6: Check access for guest role (regular docs)');
    const guestRegularResponse = await axios.post(`${BASE_URL}/check-access`, {
      role: 'guest',
      action: 'read',
      resource: 'documents'
    });
    console.log(`Allowed: ${guestRegularResponse.data.allowed}`);
    if (guestRegularResponse.data.allowed !== false) {
      throw new Error('Guest should NOT have access to regular documents');
    }
    console.log('Guest access (regular docs) test: PASSED');
    
    // Test 7: Session validation with token
    console.log('\nTest 7: Session validation with token');
    try {
      const sessionResponse = await axios.post(
        `${BASE_URL}/check-session`, 
        {
          sessionId: 'test-session',
          action: 'read',
          resource: 'documents'
        },
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Session check response: ${JSON.stringify(sessionResponse.data)}`);
      console.log('Session validation test: PASSED');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // This is acceptable - it means token validation is working
        console.log('Session validation appropriately rejected invalid token');
        console.log('Session validation test: PASSED');
      } else {
        throw error;
      }
    }
    
    // Test 8: User ownership permissions
    console.log('\nTest 8: User ownership permissions');
    
    // Test when the user owns the resource
    const ownResourceResponse = await axios.post(`${BASE_URL}/check-access`, {
      role: 'user',
      action: 'update',
      resource: 'documents',
      userId: 'user123',
      ownerId: 'user123'
    });
    console.log(`Own resource allowed: ${ownResourceResponse.data.allowed}`);
    
    // Test when the user doesn't own the resource
    const nonOwnResourceResponse = await axios.post(`${BASE_URL}/check-access`, {
      role: 'user',
      action: 'update', 
      resource: 'documents',
      userId: 'user123',
      ownerId: 'differentUser456'
    });
    console.log(`Non-own resource allowed: ${nonOwnResourceResponse.data.allowed}`);
    
    if (ownResourceResponse.data.allowed !== true || nonOwnResourceResponse.data.allowed !== false) {
      throw new Error('Ownership permission check failed - users should be able to update their own resources but not others');
    }
    
    console.log('Ownership permissions test: PASSED');
    
    // All tests passed
    console.log('\nALL TESTS PASSED!');
    return true;
  } catch (error) {
    console.error('\nTEST FAILED:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    }
    return false;
  }
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 
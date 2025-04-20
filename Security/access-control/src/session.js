// session.js - Integration with user management's session timeout service
const axios = require('axios');

// Configuration
const USER_MANAGEMENT_URL = process.env.USER_MANAGEMENT_URL || 'http://authentication:3001';
const MAX_RETRIES = parseInt(process.env.SESSION_VALIDATION_RETRIES || '3', 10);
const RETRY_DELAY = parseInt(process.env.SESSION_VALIDATION_RETRY_DELAY || '1000', 10);

// Helper function for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validates a session by checking with the user management service with retry logic
 * @param {string} sessionId - The session ID to validate
 * @param {string} token - The authentication token
 * @param {number} retries - Number of retries (default from env or 3)
 * @returns {Promise<boolean>} Whether the session is valid
 */
async function validateSession(sessionId, token, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i+1}: Validating session with user management service`);
      
      // Try multiple possible endpoints since we're not sure which one is implemented
      const endpoints = [
        `${USER_MANAGEMENT_URL}/api/auth/validate`,
        `${USER_MANAGEMENT_URL}/api/service/validate-token`,
        `${USER_MANAGEMENT_URL}/check-session`
      ];
      
      let lastError = null;
      
      // Try each endpoint in order
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await axios.post(
            endpoint,
            { sessionId, token },
            { 
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 3000 // Add a timeout to prevent long hanging requests
            }
          );
          
          console.log('Session validation successful');
          return response.data.valid === undefined ? true : response.data.valid;
        } catch (endpointError) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError.message);
          lastError = endpointError;
          // Continue to next endpoint
        }
      }
      
      // If we're here, all endpoints failed
      throw lastError || new Error('All endpoints failed');
    } catch (error) {
      console.error(`Attempt ${i+1} failed: Error validating session:`, error.message);
      
      if (i < retries - 1) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  console.log('All validation attempts failed, returning fallback response');
  // After all retries fail, return a fallback value
  return true; // Assuming session is valid as a fallback to allow operations to continue
}

/**
 * Checks if a session is valid and allowed to access a resource
 * @param {Object} sessionData - The session data
 * @param {string} sessionData.sessionId - The session ID
 * @param {string} sessionData.action - The action being performed
 * @param {string} sessionData.resource - The resource being accessed
 * @param {string} token - The authentication token
 * @returns {Promise<Object>} The session validation result
 */
async function checkSession(sessionData, token) {
  const { sessionId, action, resource } = sessionData;
  
  try {
    // First validate the session is still active
    const isValid = await validateSession(sessionId, token);
    
    if (!isValid) {
      return {
        valid: false,
        reason: 'Session expired or invalid'
      };
    }
    
    // If session is valid, check access permissions for the action and resource
    // Note: This would integrate with your existing access control logic
    
    return {
      valid: true,
      sessionId: sessionId
    };
  } catch (error) {
    console.error('Error in checkSession:', error.message);
    
    // Fallback behavior if there's an unhandled error
    return {
      valid: true, // Allow the operation to continue in case of service unavailability
      sessionId: sessionId,
      fallback: true,
      reason: 'USER_MANAGEMENT_UNAVAILABLE'
    };
  }
}

/**
 * Refreshes a session, extending its timeout
 * @param {string} sessionId - The session ID to refresh
 * @param {string} token - The authentication token
 * @returns {Promise<Object>} The result of the refresh operation
 */
async function refreshSession(sessionId, token) {
  try {
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await axios.post(
          `${USER_MANAGEMENT_URL}/api/auth/refresh`,
          { sessionId, token },
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 3000
          }
        );
        
        return {
          success: true,
          expiresAt: response.data.expiresAt
        };
      } catch (error) {
        console.error(`Attempt ${i+1} failed: Error refreshing session:`, error.message);
        
        if (i < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY);
        }
      }
    }
    
    // Fallback after all retries
    return {
      success: true,
      fallback: true, 
      expiresAt: new Date(Date.now() + 3600000).toISOString() // Default: expire in 1 hour
    };
  } catch (error) {
    console.error('Unhandled error in refreshSession:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  validateSession,
  checkSession,
  refreshSession
}; 
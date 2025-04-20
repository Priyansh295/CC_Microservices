const express = require('express');
const router = express.Router();
const { checkSession } = require('./session');
const axios = require('axios');

// Environment variables for service integration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://authentication:3001';
const RBAC_SERVICE_URL = process.env.RBAC_SERVICE_URL || 'http://rbac-service:3001';
const USER_MANAGEMENT_URL = process.env.USER_MANAGEMENT_URL || 'http://authentication:3001';

// Root path handler
router.get('/', (req, res) => {
  res.json({
    service: 'access-control',
    status: 'running',
    endpoints: [
      '/health',
      '/check-access',
      '/check-session'
    ]
  });
});

// Helper for checking dependency health without breaking the main health check
async function checkDependencyHealth(url, timeout = 2000) {
  try {
    const response = await axios.get(`${url}/health`, { timeout });
    return {
      status: 'up',
      responseTime: response.headers['x-response-time'] || 'unknown'
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message
    };
  }
}

// Enhanced health check route with dependency statuses
router.get('/health', async (req, res) => {
  // This is required for Docker health checks - must return 200 quickly
  if (req.query.quick === 'true') {
    return res.json({ status: 'healthy', service: 'access-control' });
  }

  // For detailed health checks, also check dependencies but don't fail if they're down
  const dependencies = {};
  
  // Only check dependencies for detailed health requests to keep the basic health check fast
  if (req.query.detailed === 'true') {
    // Run dependency checks in parallel
    const [authHealth, rbacHealth] = await Promise.all([
      checkDependencyHealth(AUTH_SERVICE_URL),
      checkDependencyHealth(RBAC_SERVICE_URL)
    ]);
    
    dependencies.auth = authHealth;
    dependencies.rbac = rbacHealth;
    dependencies.userManagement = await checkDependencyHealth(USER_MANAGEMENT_URL);
  }
  
  res.json({
    status: 'healthy',
    service: 'access-control',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dependencies: dependencies
  });
});

// Check access permissions
router.post('/check-access', (req, res) => {
  const { role, action, resource, ownerId, userId } = req.body;
  
  // Simple RBAC implementation
  let allowed = false;
  
  if (role === 'admin') {
    // Admins can do anything
    allowed = true;
  } else if (role === 'user') {
    // Users can read and create documents
    if (resource === 'documents' && (action === 'read' || action === 'create')) {
      allowed = true;
    }
    
    // Users can update their own documents
    if (resource === 'documents' && action === 'update' && ownerId === userId) {
      allowed = true;
    }
    
    // Users can read their profile
    if (resource === 'profile' && action === 'read') {
      allowed = true;
    }
  } else if (role === 'guest') {
    // Guests can only read public docs
    if (resource === 'public-docs' && action === 'read') {
      allowed = true;
    }
  }
  
  res.json({ allowed });
});

// Session validation endpoint - integrates with user management service
router.post('/check-session', async (req, res) => {
  try {
    const sessionData = req.body;
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    
    if (!token) {
      return res.status(401).json({
        valid: false,
        reason: 'No authentication token provided'
      });
    }
    
    try {
      const result = await checkSession(sessionData, token);
      res.json(result);
    } catch (sessionError) {
      console.error('Error checking session:', sessionError.message);
      
      // Fallback response to allow operation to continue
      res.json({
        valid: true,
        fallback: true,
        reason: 'SESSION_VALIDATION_ERROR',
        sessionId: sessionData.sessionId
      });
    }
  } catch (error) {
    console.error('Unexpected error in check-session endpoint:', error.message);
    res.status(500).json({
      valid: false,
      reason: 'Internal server error'
    });
  }
});

module.exports = router; 
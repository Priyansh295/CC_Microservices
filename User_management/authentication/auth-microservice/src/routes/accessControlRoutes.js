const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'access-control-service',
    time: new Date().toISOString()
  });
});

// Mock access check endpoint
router.post('/check-access', (req, res) => {
  const { role, action, resource } = req.body;
  
  // Define access rules based on role
  const accessRules = {
    'admin': {
      'read': ['users', 'roles', 'permissions', 'documents', 'system'],
      'create': ['users', 'roles', 'permissions', 'documents'],
      'update': ['users', 'roles', 'permissions', 'documents', 'system'],
      'delete': ['users', 'roles', 'permissions', 'documents', 'system']
    },
    'user': {
      'read': ['documents'],
      'create': ['documents'],
      'update': ['documents'],
      'delete': ['documents']
    }
  };
  
  // Check if role exists
  if (!accessRules[role]) {
    return res.status(200).json({ 
      allowed: false,
      reason: 'Unknown role'
    });
  }
  
  // Check if action exists for role
  if (!accessRules[role][action]) {
    return res.status(200).json({
      allowed: false,
      reason: 'Action not defined for role'
    });
  }
  
  // Check if resource is accessible for role+action
  const allowed = accessRules[role][action].includes(resource);
  
  return res.status(200).json({
    allowed,
    reason: allowed ? 'Access granted' : 'Access denied by policy'
  });
});

// Session check (requires authentication)
router.post('/check-session', authenticate, (req, res) => {
  const { sessionId, action, resource } = req.body;
  const user = req.user;
  
  return res.status(200).json({
    session: {
      id: sessionId,
      valid: true,
      user: {
        id: user.id,
        role: user.role
      }
    },
    access: {
      action,
      resource,
      allowed: true
    }
  });
});

module.exports = router; 
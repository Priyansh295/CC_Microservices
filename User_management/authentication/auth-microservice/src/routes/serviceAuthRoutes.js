// src/routes/serviceAuthRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { validateUserToken } = require('../services/communicationService');

// Middleware to verify service-to-service token
const verifyServiceToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const serviceName = req.headers['service-name'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ') || !serviceName) {
    return res.status(401).json({ message: 'Invalid service authentication' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(
      token, 
      process.env.INTER_SERVICE_SECRET || 'inter-service-secret'
    );
    
    if (decoded.type !== 'service-to-service') {
      return res.status(401).json({ message: 'Invalid service token type' });
    }
    
    req.callingService = decoded.service;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid service token' });
  }
};

// Validate a user token (for other services)
router.post('/validate-token', verifyServiceToken, (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }
  
  const decoded = validateUserToken(token);
  
  if (!decoded) {
    return res.status(401).json({ 
      valid: false,
      message: 'Invalid token'
    });
  }
  
  return res.status(200).json({
    valid: true,
    user: {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    }
  });
});

// Get user role for permission checks
router.post('/get-user-role', verifyServiceToken, (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  // In a real implementation, you'd fetch this from your database
  // For demonstration, we're returning a mock response
  return res.status(200).json({
    role: 'user' // Replace with actual DB lookup
  });
});

module.exports = router;
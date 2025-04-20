// src/services/communicationService.js
const axios = require('axios');
const { verifyToken } = require('../utils/tokenUtils');

// Service registry (can be moved to configuration)
const serviceRegistry = {
  'profile': process.env.PROFILE_SERVICE_URL || 'http://profile-service:3002',
  'registration': process.env.REGISTRATION_SERVICE_URL || 'http://registration-service:3003',
  'notification': process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004',
  'rbac': process.env.RBAC_SERVICE_URL || 'http://rbac-service:3005',
};

// Create HTTP clients for other services
const serviceClients = {};

Object.entries(serviceRegistry).forEach(([service, url]) => {
  serviceClients[service] = axios.create({
    baseURL: url,
    timeout: 5000,
  });
});

// Authentication helper for inter-service communication
const createServiceToken = () => {
  // In a real-world scenario, you might use a service-specific JWT
  // For simplicity, we're using a shared secret environment variable
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      service: 'auth',
      type: 'service-to-service'
    },
    process.env.INTER_SERVICE_SECRET || 'inter-service-secret',
    { expiresIn: '1h' }
  );
};

// Method to call another service
const callService = async (serviceName, method, endpoint, data = null, headers = {}) => {
  if (!serviceClients[serviceName]) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  const serviceToken = createServiceToken();
  
  try {
    const response = await serviceClients[serviceName]({
      method,
      url: endpoint,
      data,
      headers: {
        'Authorization': `Bearer ${serviceToken}`,
        'Service-Name': 'auth',
        ...headers
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error calling ${serviceName} service:`, error.message);
    throw error;
  }
};

// Validate user token for other services
const validateUserToken = (token) => {
  return verifyToken(token);
};

module.exports = {
  callService,
  validateUserToken,
  serviceRegistry
};
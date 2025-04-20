const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/validate', authenticate, authController.validateToken);

module.exports = router; 
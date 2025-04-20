const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);

// User management routes (admin only)
router.post('/users', authenticate, authorize(['admin']), authController.createTestUser);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/validate', authenticate, authController.validateToken);

module.exports = router;
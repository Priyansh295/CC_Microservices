const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'data-encryption-service',
    time: new Date().toISOString()
  });
});

// Mock encryption key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'mock-encryption-key-for-testing-12345678';
const IV_LENGTH = 16; // AES block size

// Encrypt data
router.post('/encrypt', (req, res) => {
  try {
    const { plaintext } = req.body;
    
    if (!plaintext) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing plaintext'
      });
    }
    
    // Generate IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
      iv
    );
    
    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Include IV in the result
    const result = iv.toString('hex') + ':' + encrypted;
    
    return res.status(200).json({
      status: 'ok',
      encrypted: result
    });
  } catch (error) {
    console.error('Encryption error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Encryption failed',
      error: error.message
    });
  }
});

// Decrypt data
router.post('/decrypt', (req, res) => {
  try {
    const { encrypted } = req.body;
    
    if (!encrypted) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing encrypted data'
      });
    }
    
    // Split IV and encrypted data
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid encrypted format'
      });
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
      iv
    );
    
    // Decrypt
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return res.status(200).json({
      status: 'ok',
      decrypted
    });
  } catch (error) {
    console.error('Decryption error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Decryption failed',
      error: error.message
    });
  }
});

module.exports = router; 
const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret-key-for-jwt',
    { expiresIn: parseInt(process.env.TOKEN_EXPIRY || '86400') }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-for-jwt');
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken }; 
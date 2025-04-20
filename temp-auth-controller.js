const bcrypt = require('bcryptjs');
const supabase = require('../services/supabaseService');
const { generateToken } = require('../utils/tokenUtils');

const login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    // Get user from Supabase
    console.log('Looking up user in database...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log('Database lookup result:', { found: !!data, error: error?.message });

    if (error || !data) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    console.log('Found user, stored hash:', data.password ? '[REDACTED]' : 'undefined');
    
    if (!data.password) {
      return res.status(401).json({ message: 'User has no password set' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, data.password);
    console.log('Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(data);

    // Return user info and token
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: data.id,
        email: data.email,
        role: data.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const logout = (req, res) => {
  // Client-side will handle token removal
  return res.status(200).json({ message: 'Logout successful' });
};

const validateToken = (req, res) => {
  // If middleware passed, token is valid
  return res.status(200).json({
    valid: true,
    user: req.user
  });
};

module.exports = {
  login,
  logout,
  validateToken
}; 
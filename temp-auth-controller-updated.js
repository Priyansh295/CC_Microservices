const bcrypt = require('bcryptjs');
const { supabase, getUsers } = require('../services/supabaseService');
const { generateToken } = require('../utils/tokenUtils');

const login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    // Get user from Supabase using the fixed helper
    console.log('Looking up user in database...');
    const { data, error } = await getUsers({ email });

    // If no results or empty array, handle appropriately
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Database error', details: error.message });
    }

    // Check if we got any results
    if (!data || data.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get the first matching user
    const user = data[0];
    console.log('Found user with ID:', user.id);

    // Check if user has a password
    if (!user.password) {
      console.log('User has no password set');
      return res.status(401).json({ message: 'Account requires password reset' });
    }

    // Compare passwords
    console.log('Comparing password with stored hash');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user info and token
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user' // Default to 'user' if role is not set
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error', details: error.message });
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

// Add a function to create test users for admin testing
const createTestUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // Check if user already exists
    const { data: existingUsers } = await getUsers({ email });
    
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          password: hashedPassword, 
          role: role || 'user',
          created_at: new Date().toISOString()
        }
      ]);
      
    if (error) {
      return res.status(500).json({ message: 'Error creating user', details: error.message });
    }
    
    return res.status(201).json({ 
      message: 'User created successfully',
      email,
      role: role || 'user'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  logout,
  validateToken,
  createTestUser
}; 
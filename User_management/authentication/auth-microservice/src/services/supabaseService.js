const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Create the Supabase client with proper URL and key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Debug logging for initial connection
console.log('Supabase client initialized with URL:', process.env.SUPABASE_URL);

// Helper function to get a user by email
const getUserByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    return { data, error };
  } catch (err) {
    console.error('Error fetching user by email:', err);
    return { data: null, error: err };
  }
};

// Helper function to get a user by ID
const getUserById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    return { data, error };
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    return { data: null, error: err };
  }
};

// Helper function to list users
const listUsers = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(limit);
    
    return { data, error };
  } catch (err) {
    console.error('Error listing users:', err);
    return { data: null, error: err };
  }
};

// Helper function to insert a user
const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData]);
    
    return { data, error };
  } catch (err) {
    console.error('Error creating user:', err);
    return { data: null, error: err };
  }
};

// Simplified helper that can be called many ways
const getUsers = async (options = {}) => {
  const { email, id, limit = 10 } = options;
  
  try {
    if (email) {
      const result = await getUserByEmail(email);
      // Return array format for consistency
      if (result.data) {
        return { data: [result.data], error: result.error };
      }
      return { data: [], error: result.error };
    }
    
    if (id) {
      const result = await getUserById(id);
      // Return array format for consistency
      if (result.data) {
        return { data: [result.data], error: result.error };
      }
      return { data: [], error: result.error };
    }
    
    return listUsers(limit);
  } catch (err) {
    console.error('Error in getUsers:', err);
    return { data: [], error: err };
  }
};

// Setup test users for the integration testing
const setupTestUsers = async () => {
  try {
    console.log('Setting up test users...');
    
    // Test user data
    const testUsers = [
      { email: 'admin@example.com', password: 'adminpassword', role: 'admin' },
      { email: 'user@example.com', password: 'userpassword', role: 'user' }
    ];
    
    for (const user of testUsers) {
      // Check if user exists
      const { data } = await getUsers({ email: user.email });
      
      if (!data || data.length === 0) {
        console.log(`Creating test user: ${user.email}`);
        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Create the user
        await createUser({ 
          email: user.email, 
          password: hashedPassword, 
          role: user.role,
          created_at: new Date().toISOString()
        });
        
        console.log(`Test user created: ${user.email}`);
      } else {
        console.log(`Test user already exists: ${user.email}`);
      }
    }
    
    console.log('Test users setup complete');
  } catch (error) {
    console.error('Error setting up test users:', error);
  }
};

// Call setup on module load
setupTestUsers();

// Export both the raw client and helper methods
module.exports = {
  supabase,
  getUsers,
  getUserByEmail,
  getUserById,
  listUsers,
  createUser,
  setupTestUsers
};
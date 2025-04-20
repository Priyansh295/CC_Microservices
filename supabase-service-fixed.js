const { createClient } = require('@supabase/supabase-js');
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
  
  if (email) {
    return getUserByEmail(email);
  }
  
  if (id) {
    return getUserById(id);
  }
  
  return listUsers(limit);
};

// Export both the raw client and helper methods
module.exports = {
  supabase,
  getUsers,
  getUserByEmail,
  getUserById,
  listUsers,
  createUser
}; 
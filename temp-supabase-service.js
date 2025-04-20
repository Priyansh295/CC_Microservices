const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create the Supabase client with proper URL and key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Debug logging for initial connection
console.log('Supabase client initialized with URL:', process.env.SUPABASE_URL);

// Fix the table name - the error shows it's trying to access "public.public.users"
// Let's create a wrapper to ensure we're using the correct table name
const getUsers = async (options = {}) => {
  const { email, id, limit = 10 } = options;
  
  let query = supabase.from('users');  // Correct table name without 'public.' prefix
  
  if (email) {
    query = query.eq('email', email);
  }
  
  if (id) {
    query = query.eq('id', id);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  return query.select('*');
};

// Export both the raw client and helper methods
module.exports = {
  supabase,
  getUsers
}; 
// test-login.js
const { createClient } = require('@supabase/supabase-js');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testLogin() {
  try {
    const email = 'test@example.com';
    const password = 'password123';
    
    console.log('Testing login for user:', email);
    
    // Query the user directly from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return;
    }
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      password_hash_exists: !!user.password
    });
    
    // Manually verify the password
    const passwordMatch = await bcryptjs.compare(password, user.password);
    
    console.log('Password match:', passwordMatch);
    
    if (passwordMatch) {
      console.log('Login would be successful');
    } else {
      console.log('Login would fail due to incorrect password');
    }
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

testLogin(); 
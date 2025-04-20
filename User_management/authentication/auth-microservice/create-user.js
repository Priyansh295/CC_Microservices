// create-user.js
const bcryptjs = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function createUser() {
  try {
    const email = 'test@example.com';
    const password = 'password123';
    const hash = await bcryptjs.hash(password, 10);
    
    console.log('Creating user:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (existingUser && existingUser.length > 0) {
      console.log('User already exists, updating password');
      const { data, error } = await supabase
        .from('users')
        .update({ password: hash })
        .eq('email', email);
      
      if (error) {
        console.error('Error updating user:', error);
      } else {
        console.log('User updated successfully');
      }
    } else {
      console.log('Creating new user');
      const { data, error } = await supabase
        .from('users')
        .insert([
          { email, password: hash, role: 'user' }
        ]);
      
      if (error) {
        console.error('Error creating user:', error);
      } else {
        console.log('User created successfully');
      }
    }
    
    // Verify user exists
    const { data: checkUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    console.log('Verification:', { 
      exists: checkUser && checkUser.length > 0,
      error: checkError ? checkError.message : null
    });
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

createUser();
// create-admin-user.js
const bcryptjs = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const RBAC_SERVICE_URL = process.env.RBAC_SERVICE_URL || 'http://localhost:3006';

async function createAdminUser() {
  try {
    const email = 'admin@example.com';
    const password = 'Admin123!';
    const hash = await bcryptjs.hash(password, 10);
    
    console.log('Creating admin user:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    let userId;
    
    if (existingUser && existingUser.length > 0) {
      console.log('Admin user already exists, updating password');
      const { data, error } = await supabase
        .from('users')
        .update({ password: hash, role: 'admin' })
        .eq('email', email);
      
      if (error) {
        console.error('Error updating user:', error);
        return;
      } else {
        console.log('Admin user updated successfully');
        userId = existingUser[0].id;
      }
    } else {
      console.log('Creating new admin user');
      const { data, error } = await supabase
        .from('users')
        .insert([
          { email, password: hash, role: 'admin' }
        ]);
      
      if (error) {
        console.error('Error creating admin user:', error);
        return;
      } else {
        console.log('Admin user created successfully');
        
        // Get the user ID of the newly created user
        const { data: newUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', email);
        
        if (newUser && newUser.length > 0) {
          userId = newUser[0].id;
        }
      }
    }
    
    // Verify user exists
    const { data: checkUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    console.log('Verification:', { 
      exists: checkUser && checkUser.length > 0,
      userId: userId,
      error: checkError ? checkError.message : null
    });
    
    // Assign admin role in RBAC service if we have a user ID
    if (userId) {
      try {
        console.log('Assigning admin role to user in RBAC service...');
        
        // Get admin role ID
        const rolesResponse = await axios.get(`${RBAC_SERVICE_URL}/api/v1/roles`);
        const adminRole = rolesResponse.data.find(role => role.role_name === 'admin');
        
        if (adminRole) {
          // Assign admin role to user
          await axios.post(
            `${RBAC_SERVICE_URL}/api/v1/users/${userId}/roles`,
            { role_id: adminRole.role_id }
          );
          console.log('Admin role assigned successfully');
        } else {
          console.error('Admin role not found in RBAC service');
        }
      } catch (rbacError) {
        console.error('Error assigning admin role:', rbacError.message);
      }
    }
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

createAdminUser();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const RBAC_SERVICE_URL = process.env.RBAC_SERVICE_URL || 'http://rbac-service:3001';

async function assignAdminRole() {
  try {
    const email = 'test@example.com';
    
    // Get user ID from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error getting user:', error);
      return;
    }
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('Found user:', user);
    
    // Get admin role from RBAC service
    try {
      console.log('Getting roles from RBAC service...');
      const rolesResponse = await axios.get(`${RBAC_SERVICE_URL}/api/v1/roles`);
      console.log('Available roles:', rolesResponse.data);
      
      const adminRole = rolesResponse.data.find(role => role.role_name === 'admin');
      
      if (!adminRole) {
        console.error('Admin role not found in RBAC service');
        return;
      }
      
      console.log('Found admin role:', adminRole);
      
      // Assign admin role to user
      console.log(`Assigning admin role to user ${user.id}...`);
      const assignResponse = await axios.post(
        `${RBAC_SERVICE_URL}/api/v1/users/${user.id}/roles`,
        { role_id: adminRole.role_id }
      );
      
      console.log('Assignment response:', assignResponse.data);
      console.log('Admin role assigned successfully');
      
    } catch (rbacError) {
      console.error('Error with RBAC service:', rbacError.message);
      if (rbacError.response) {
        console.error('Response data:', rbacError.response.data);
        console.error('Response status:', rbacError.response.status);
      }
    }
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

assignAdminRole(); 
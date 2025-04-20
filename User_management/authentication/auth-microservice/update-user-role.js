const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function updateUserRole() {
  try {
    const email = 'test@example.com';
    const newRole = 'admin';
    
    console.log(`Updating user ${email} to role: ${newRole}`);
    
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('email', email);
    
    if (error) {
      console.error('Error updating user role:', error);
    } else {
      console.log('User role updated successfully');
    }
    
    // Verify the update
    const { data: checkUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    console.log('User data:', checkUser);
    console.log('Error:', checkError);
  } catch (err) {
    console.error('Script error:', err);
  }
}

updateUserRole(); 
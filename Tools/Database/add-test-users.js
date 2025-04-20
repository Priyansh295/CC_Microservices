const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Supabase credentials from docker-compose.yml
const SUPABASE_URL = 'https://mabvshocptggarpjaznk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYnZzaG9jcHRnZ2FycGphem5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDg2NTYsImV4cCI6MjA2MDEyNDY1Nn0.TMtkUdLM-Dv1x57xFMqU7mxJ00w8Lltxx9BNArOJNmw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to create a user
async function createUser(userData) {
  try {
    // Check if user already exists
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .maybeSingle();
    
    if (searchError) {
      console.error('Error checking for existing user:', searchError);
      return { success: false, error: searchError };
    }
    
    if (existingUser) {
      console.log(`User ${userData.email} already exists.`);
      return { success: true, user: existingUser };
    }
    
    // Hash password if provided
    if (userData.password) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      userData.password = hashedPassword;
    }
    
    // Add created_at timestamp
    userData.created_at = new Date().toISOString();
    
    // Insert the user
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return { success: false, error };
    }
    
    console.log(`User ${userData.email} created successfully.`);
    return { success: true, user: data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
}

// List of test users to create
const testUsers = [
  { email: 'admin@example.com', password: 'adminpassword', role: 'admin' },
  { email: 'user@example.com', password: 'userpassword', role: 'user' }
];

// Create all test users
async function setupTestUsers() {
  console.log('Setting up test users in Supabase...');
  
  for (const user of testUsers) {
    console.log(`Attempting to create or verify user: ${user.email}`);
    const result = await createUser(user);
    
    if (result.success) {
      console.log(`Result for ${user.email}: Success`);
    } else {
      console.log(`Result for ${user.email}: Failed - ${result.error.message}`);
    }
  }
  
  console.log('Test user setup complete');
  
  // List all users to verify
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('Error listing users:', error);
  } else {
    console.log('Current users in database:');
    data.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
  }
}

// Run the setup
setupTestUsers()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 
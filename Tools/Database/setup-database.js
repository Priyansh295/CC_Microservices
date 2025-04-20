// Database setup script
// Run with: node setup-database.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function setupDatabase() {
  console.log('Starting database setup...');
  
  try {
    // Check if users table exists by querying it
    const { data: tableExists, error: tableError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    // If table doesn't exist, we'll create it using SQL
    if (tableError && tableError.code === '42P01') {
      console.log('Users table does not exist. Creating...');
      
      // Use Supabase SQL to create the table
      const { error: createError } = await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.error('Error creating users table:', createError);
        // If we can't use RPC, try another approach
        // Note: This might not work directly and would need manual table creation
        console.log('Manual table creation may be required in the Supabase dashboard');
      } else {
        console.log('Users table created successfully!');
      }
    } else {
      console.log('Users table already exists.');
    }
    
    // Create test users if they don't exist
    await createUserIfNotExists('test@example.com', 'password123', 'user');
    await createUserIfNotExists('admin@example.com', 'admin123', 'admin');
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

async function createUserIfNotExists(email, password, role) {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  if (existingUser) {
    console.log(`User ${email} already exists.`);
    return;
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const { error } = await supabase
    .from('users')
    .insert([
      {
        email,
        password: hashedPassword,
        role
      }
    ]);
  
  if (error) {
    console.error(`Error creating user ${email}:`, error);
  } else {
    console.log(`User ${email} created successfully with role: ${role}`);
  }
}

// Run the setup
setupDatabase().catch(console.error); 
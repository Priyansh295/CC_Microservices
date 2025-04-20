const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// SQLite database setup
const dbPath = path.join(dataDir, 'auth.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('SQLite database initialized at:', dbPath);
});

// Generate a random ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Helper function to get a user by email
const getUserByEmail = (email) => {
  return new Promise((resolve) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        console.error('Error fetching user by email:', err);
        return resolve({ data: null, error: err });
      }
      return resolve({ data: row, error: null });
    });
  });
};

// Helper function to get a user by ID
const getUserById = (id) => {
  return new Promise((resolve) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching user by ID:', err);
        return resolve({ data: null, error: err });
      }
      return resolve({ data: row, error: null });
    });
  });
};

// Helper function to list users
const listUsers = (limit = 10) => {
  return new Promise((resolve) => {
    db.all('SELECT * FROM users LIMIT ?', [limit], (err, rows) => {
      if (err) {
        console.error('Error listing users:', err);
        return resolve({ data: null, error: err });
      }
      return resolve({ data: rows, error: null });
    });
  });
};

// Helper function to insert a user
const createUser = (userData) => {
  return new Promise((resolve) => {
    const id = userData.id || generateId();
    const { email, password, role = 'user' } = userData;
    const created_at = userData.created_at || new Date().toISOString();
    
    db.run(
      'INSERT INTO users (id, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, email, password, role, created_at],
      function(err) {
        if (err) {
          console.error('Error creating user:', err);
          return resolve({ data: null, error: err });
        }
        
        // Get the created user
        getUserById(id).then(result => {
          resolve({ data: result.data, error: null });
        });
      }
    );
  });
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
    
    const result = await listUsers(limit);
    return result;
  } catch (err) {
    console.error('Error in getUsers:', err);
    return { data: [], error: err };
  }
};

// Setup test users for the integration testing
const setupTestUsers = async () => {
  try {
    console.log('Setting up test users in SQLite...');
    
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
          id: generateId(),
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

module.exports = {
  db,
  getUsers,
  getUserByEmail,
  getUserById,
  listUsers,
  createUser,
  setupTestUsers
}; 
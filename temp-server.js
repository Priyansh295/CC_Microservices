// src/server.js
const express = require('express');
const cors = require('cors');
const supabase = require('./services/supabaseService');
const authRoutes = require('./routes/authRoutes');
const serviceAuthRoutes = require('./routes/serviceAuthRoutes');
const PORT = process.env.PORT || 3001;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Inter-service routes
app.use('/api/service', serviceAuthRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'Auth service is up and running',
    version: '1.0.0'
  });
});

// Add to server.js
app.get('/api/check-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email');

    return res.status(200).json({
      message: 'Database check',
      users: data || [],
      error: error ? error.message : null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/check-db-connection', async (req, res) => {
  console.log('Checking database connection...');

  try {
    // Simple query that doesn't use aggregates
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);

    if (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({
        connected: false,
        message: 'Database connection failed',
        error: error.message
      });
    }

    console.log('Database connection successful!');
    console.log('Sample users:', data.map(user => user.email));

    return res.status(200).json({
      connected: true,
      message: 'Successfully connected to database',
      userCount: data.length,
      users: data.map(user => ({ id: user.id, email: user.email }))
    });

  } catch (error) {
    console.error('Unexpected error checking database connection:', error);
    return res.status(500).json({
      connected: false,
      message: 'Error checking database connection',
      error: error.message
    });
  }
});

app.get('/api/check-user/:email', async (req, res) => {
  const { email } = req.params;
  console.log('Looking up user with email:', email);

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    console.log('Query result:', {
      hasError: !!error,
      errorMessage: error?.message,
      dataReceived: !!data,
      recordCount: data?.length || 0
    });

    return res.status(200).json({
      query: { table: 'users', email },
      result: { found: data && data.length > 0, count: data?.length || 0 },
      error: error?.message || null
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
}); 
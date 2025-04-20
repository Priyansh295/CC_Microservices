// server.js
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

// Create Express app
const app = express();
const PORT = process.env.SERVICE_PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/', routes);

// Start server
app.listen(PORT, () => {
  console.log(`Access Control service running on port ${PORT}`);
}); 
// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { recordActivity, getUserActivity } = require('./activity_logger');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3003; // Updated to match Docker config
const LOG_DIR = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'bug-monitoring',
    status: 'running',
    endpoints: [
      '/health',
      '/log-error',
      '/report',
      '/log',
      '/error',
      '/errors',
      '/stats',
      '/activity/:userId'
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'bug-monitoring' });
});

// Log error function
function logError(errorData) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: errorData.severity || 'error',
    message: errorData.error,
    source: errorData.service || 'unknown',
    userId: errorData.userId || 'anonymous',
    endpoint: errorData.endpoint || 'unknown',
    stack: errorData.stack || '',
    ...errorData
  };
  
  // Save to log file
  const logFile = path.join(LOG_DIR, `${logEntry.level}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  
  // If this is user activity, record it with activity logger
  if (logEntry.source === 'user-management' && logEntry.userId !== 'anonymous') {
    recordActivity({
      userId: logEntry.userId,
      action: logEntry.message,
      details: `Level: ${logEntry.level}`
    }).catch(err => console.error('Error recording activity:', err));
  }
  
  return { success: true, logged: logEntry };
}

// Log error endpoint (original)
app.post('/log-error', (req, res) => {
  const { message, level = 'info', source = 'unknown', userId = 'anonymous' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Missing error message' });
  }
  
  const result = logError({
    error: message,
    severity: level,
    service: source,
    userId: userId
  });
  
  res.json(result);
});

// New endpoints for integration with security microservices

// Report endpoint - main error reporting endpoint
app.post('/report', (req, res) => {
  try {
    const errorData = req.body;
    
    if (!errorData.error && !errorData.message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: error or message' 
      });
    }
    
    // Use message field if error is not provided
    if (!errorData.error && errorData.message) {
      errorData.error = errorData.message;
    }
    
    const result = logError(errorData);
    
    return res.status(200).json({
      success: true,
      message: 'Error reported successfully',
      ...result
    });
  } catch (error) {
    console.error('Error reporting bug:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to report error',
      error: error.message
    });
  }
});

// Log endpoint - alternative error reporting endpoint
app.post('/log', (req, res) => {
  try {
    const errorData = req.body;
    
    if (!errorData.error && !errorData.message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: error or message' 
      });
    }
    
    // Use message field if error is not provided
    if (!errorData.error && errorData.message) {
      errorData.error = errorData.message;
    }
    
    const result = logError(errorData);
    
    return res.status(200).json({
      success: true,
      message: 'Error logged successfully',
      ...result
    });
  } catch (error) {
    console.error('Error logging bug:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log error',
      error: error.message
    });
  }
});

// Error endpoint - another alternative error reporting endpoint
app.post('/error', (req, res) => {
  try {
    const errorData = req.body;
    
    if (!errorData.error && !errorData.message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: error or message' 
      });
    }
    
    // Use message field if error is not provided
    if (!errorData.error && errorData.message) {
      errorData.error = errorData.message;
    }
    
    const result = logError(errorData);
    
    return res.status(200).json({
      success: true,
      message: 'Error recorded successfully',
      ...result
    });
  } catch (error) {
    console.error('Error recording bug:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record error',
      error: error.message
    });
  }
});

// Get errors endpoint
app.get('/errors', (req, res) => {
  try {
    const level = req.query.level || 'all';
    const limit = parseInt(req.query.limit) || 100;
    
    const errors = [];
    
    if (level === 'all') {
      // Read from all log files
      const logFiles = fs.readdirSync(LOG_DIR).filter(file => file.endsWith('.log'));
      
      for (const file of logFiles) {
        if (fs.existsSync(path.join(LOG_DIR, file))) {
          const content = fs.readFileSync(path.join(LOG_DIR, file), 'utf8');
          const logs = content.split('\n')
            .filter(line => line.trim() !== '')
            .map(line => JSON.parse(line));
          
          errors.push(...logs);
        }
      }
    } else {
      // Read from specific log file
      const logFile = path.join(LOG_DIR, `${level}.log`);
      
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        const logs = content.split('\n')
          .filter(line => line.trim() !== '')
          .map(line => JSON.parse(line));
        
        errors.push(...logs);
      }
    }
    
    // Sort by timestamp (newest first) and limit
    errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedErrors = errors.slice(0, limit);
    
    res.json({ errors: limitedErrors });
  } catch (error) {
    console.error('Error retrieving errors:', error);
    res.status(500).json({ error: 'Failed to retrieve errors' });
  }
});

// Get error statistics
app.get('/stats', (req, res) => {
  try {
    const errors = [];
    const logFiles = fs.readdirSync(LOG_DIR).filter(file => file.endsWith('.log'));
    
    for (const file of logFiles) {
      if (fs.existsSync(path.join(LOG_DIR, file))) {
        const content = fs.readFileSync(path.join(LOG_DIR, file), 'utf8');
        const logs = content.split('\n')
          .filter(line => line.trim() !== '')
          .map(line => JSON.parse(line));
        
        errors.push(...logs);
      }
    }
    
    // Calculate statistics
    const stats = {
      total: errors.length,
      byLevel: {},
      bySources: {}
    };
    
    errors.forEach(error => {
      // Count by level
      if (!stats.byLevel[error.level]) {
        stats.byLevel[error.level] = 0;
      }
      stats.byLevel[error.level]++;
      
      // Count by source
      if (!stats.bySources[error.source]) {
        stats.bySources[error.source] = 0;
      }
      stats.bySources[error.source]++;
    });
    
    res.json({ stats });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

// Get user activity logs
app.get('/activity/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }
    
    const result = await getUserActivity(userId);
    
    if (result.success) {
      res.json({ activities: result.activities });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({ error: 'Failed to retrieve user activity' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Bug Monitoring service running on port ${PORT}`);
}); 
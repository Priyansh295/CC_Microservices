const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseService');

// Basic health check
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'auth-service',
    time: new Date().toISOString()
  });
});

// Database connection check
router.get('/db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (error) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed', 
        error: error.message 
      });
    }
    
    return res.status(200).json({ 
      status: 'ok',
      database: 'connected',
      records: data.length
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'error',
      message: 'Database check failed',
      error: error.message 
    });
  }
});

// Mock endpoints for test script compatibility
router.get('/vulnerability-scanner', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'vulnerability-scanner-mock',
    capabilities: ['mock-scan']
  });
});

router.get('/bug-monitoring', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'bug-monitoring-mock',
    capabilities: ['mock-reports']
  });
});

router.post('/vulnerability-scanner/scan', (req, res) => {
  res.status(200).json({
    scan_id: 'mock-scan-' + Date.now(),
    status: 'completed',
    results: {
      vulnerabilities: [],
      status: 'no issues found (mock)'
    }
  });
});

router.post('/bug-monitoring/report', (req, res) => {
  res.status(200).json({
    report_id: 'mock-report-' + Date.now(),
    status: 'received',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 
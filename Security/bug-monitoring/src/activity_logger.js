// activity_logger.js - Integration with User Management's activity logs
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const USER_MANAGEMENT_URL = process.env.USER_MANAGEMENT_URL || 'http://user-management-backend:5000';
const ACTIVITY_LOG_DIR = path.join(__dirname, '../logs/activity');

// Ensure log directory exists
if (!fs.existsSync(ACTIVITY_LOG_DIR)) {
  fs.mkdirSync(ACTIVITY_LOG_DIR, { recursive: true });
}

/**
 * Record user activity in local logs and forward to user management
 * @param {Object} activityData - Activity data to record
 * @param {string} activityData.userId - User ID
 * @param {string} activityData.action - Action performed
 * @param {string} activityData.details - Activity details
 * @returns {Promise<Object>} Activity logging result
 */
async function recordActivity(activityData) {
  try {
    const { userId, action, details } = activityData;
    const timestamp = new Date().toISOString();
    
    // Create log entry
    const logEntry = {
      timestamp,
      userId,
      action,
      details,
      source: 'bug-monitoring'
    };
    
    // Log to local file
    const logFile = path.join(ACTIVITY_LOG_DIR, `${userId}-activity.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
    // Forward to user management
    try {
      const response = await axios.post(
        `${USER_MANAGEMENT_URL}/activity-logs/record`, 
        logEntry
      );
      return {
        success: true,
        localLog: logFile,
        forwardedToUserManagement: true,
        response: response.data
      };
    } catch (apiError) {
      console.error('Failed to forward activity to user management:', apiError.message);
      return {
        success: true,
        localLog: logFile,
        forwardedToUserManagement: false,
        error: apiError.message
      };
    }
  } catch (error) {
    console.error('Error recording activity:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get activity logs for a specific user
 * @param {string} userId - User ID to get logs for
 * @returns {Promise<Object>} User activity logs
 */
async function getUserActivity(userId) {
  try {
    const logFile = path.join(ACTIVITY_LOG_DIR, `${userId}-activity.log`);
    
    if (!fs.existsSync(logFile)) {
      return {
        success: true,
        userId,
        activities: []
      };
    }
    
    // Read and parse log file
    const logs = fs.readFileSync(logFile, 'utf8')
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => JSON.parse(line));
    
    return {
      success: true,
      userId,
      activities: logs
    };
  } catch (error) {
    console.error('Error getting user activity:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  recordActivity,
  getUserActivity
}; 
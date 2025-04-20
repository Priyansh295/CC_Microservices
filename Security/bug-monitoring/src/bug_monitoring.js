const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());

const LOG_FILE = path.join(__dirname, "../logs/error.log");

// Ensure log directory exists
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

// Log error endpoint
app.post("/log-error", (req, res) => {
  const { message, stack, level = "error", source, userId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    stack,
    source,
    userId
  };
  
  fs.appendFile(LOG_FILE, JSON.stringify(logEntry) + "\n", (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
      return res.status(500).json({ error: "Failed to log error" });
    }
    
    res.json({ success: true, entryId: timestamp });
  });
});

// Get errors endpoint
app.get("/errors", (req, res) => {
  const { limit = 100, level, source } = req.query;
  
  fs.readFile(LOG_FILE, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.json({ errors: [] });
      }
      return res.status(500).json({ error: "Failed to read log file" });
    }
    
    let errors = data
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line));
    
    if (level) {
      errors = errors.filter(entry => entry.level === level);
    }
    
    if (source) {
      errors = errors.filter(entry => entry.source === source);
    }
    
    errors = errors.slice(-parseInt(limit));
    
    res.json({ errors });
  });
});

// Get stats endpoint
app.get("/stats", (req, res) => {
  fs.readFile(LOG_FILE, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.json({ stats: { total: 0, byLevel: {}, bySources: {} } });
      }
      return res.status(500).json({ error: "Failed to read log file" });
    }
    
    const errors = data
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line));
    
    const stats = {
      total: errors.length,
      byLevel: {},
      bySources: {}
    };
    
    errors.forEach(entry => {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
      if (entry.source) {
        stats.bySources[entry.source] = (stats.bySources[entry.source] || 0) + 1;
      }
    });
    
    res.json({ stats });
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Bug Monitoring service running on port ${port}`);
});

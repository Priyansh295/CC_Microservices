const supabaseService = require('./supabaseService');
const sqliteService = require('./sqliteService');

// Environment variable to control which database to use
// Set to 'sqlite' to use SQLite, anything else uses Supabase
const USE_SQLITE = process.env.AUTH_DB?.toLowerCase() === 'sqlite' || process.env.NODE_ENV === 'test';

console.log(`Using ${USE_SQLITE ? 'SQLite' : 'Supabase'} database for authentication`);

// Export the appropriate service based on environment variable
module.exports = USE_SQLITE ? sqliteService : supabaseService; 
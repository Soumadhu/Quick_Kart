const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Database file path
const DB_PATH = path.join(__dirname, '../../data/quickkart.db');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  // Initialize database schema
  initDatabase();
});

// Promisify database methods
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Initialize database schema
const initDatabase = async () => {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        original_price REAL,
        unit TEXT DEFAULT 'pcs',
        image_url TEXT,
        stock INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        delivery_time TEXT DEFAULT '30-45 min',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add trigger for updated_at
    await run(`
      CREATE TRIGGER IF NOT EXISTS update_products_timestamp
      AFTER UPDATE ON products
      BEGIN
        UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
      END;
    `);
    
    console.log('SQLite database schema initialized');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    process.exit(1);
  }
};

// Test the connection
const testConnection = async () => {
  try {
    await run('SELECT 1');
    console.log('Successfully connected to SQLite database');
    return true;
  } catch (error) {
    console.error('Error connecting to SQLite database:', error);
    process.exit(1);
  }
};

// Export database methods
module.exports = {
  query,
  run,
  testConnection,
  initDatabase,
  // For transactions
  transaction: (queries) => {
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        try {
          await run('BEGIN TRANSACTION');
          
          const results = [];
          for (const { sql, params = [] } of queries) {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
              const rows = await query(sql, params);
              results.push(rows);
            } else {
              const result = await run(sql, params);
              results.push(result);
            }
          }
          
          await run('COMMIT');
          resolve(results);
        } catch (error) {
          await run('ROLLBACK');
          reject(error);
        }
      });
    });
  }
};

// Test the connection when this module is loaded
testConnection();

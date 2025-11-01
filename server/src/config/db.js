const knex = require('knex');
const path = require('path');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Database configuration
const config = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../../data/quickkart.sqlite3')
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, '../database/migrations')
  },
  seeds: {
    directory: path.join(__dirname, '../database/seeds')
  },
  pool: {
    afterCreate: (conn, cb) => {
      // Enable foreign key constraints
      conn.run('PRAGMA foreign_keys = ON', cb);
    }
  }
};

// Create database instance
const db = knex(config);

// Test the database connection
db.raw('SELECT 1+1 as result')
  .then(() => {
    console.log('Successfully connected to SQLite database');
  })
  .catch(err => {
    console.error('Error connecting to the database', err);
  });

module.exports = {
  // Raw query helper
  query: (text, params) => {
    return db.raw(text, params || []);
  },
  
  // Get a transaction
  transaction: () => {
    return db.transaction();
  },
  
  // Get the Knex instance for query building
  knex: () => db,
  
  // Close the database connection (for graceful shutdown)
  close: () => {
    return db.destroy();
  }
};

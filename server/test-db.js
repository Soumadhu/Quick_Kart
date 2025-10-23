const { Pool } = require('pg');
require('dotenv').config();

console.log('Environment Variables:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

console.log('\nAttempting to connect to PostgreSQL...');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error details:', err);
  } else {
    console.log('✅ Successfully connected to PostgreSQL');
    console.log('Server time:', res.rows[0].now);
  }
  
  pool.end(() => {
    console.log('\nConnection closed');
    process.exit(err ? 1 : 0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

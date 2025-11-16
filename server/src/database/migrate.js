const knex = require('knex');
const config = require('../config/db');

async function migrate() {
  try {
    const db = config.knex();
    
    // Run migrations only
    console.log('Running migrations...');
    await db.migrate.latest();
    
    console.log('Database migration completed successfully');
    console.log('To seed the database, run: npm run seed');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

migrate();

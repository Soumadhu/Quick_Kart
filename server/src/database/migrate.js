const knex = require('knex');
const config = require('../config/db');

async function migrate() {
  try {
    const db = config.knex();
    
    // Run migrations
    console.log('Running migrations...');
    await db.migrate.latest();
    
    // Run seeds
    console.log('Running seeds...');
    await db.seed.run();
    
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

migrate();

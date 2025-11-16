const knex = require('knex');
const config = require('../config/db');

async function seed() {
  try {
    const db = config.knex();
    
    // Run seeds only
    console.log('Running seeds...');
    await db.seed.run();
    
    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  }
}

seed();

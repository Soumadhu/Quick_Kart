const knex = require('knex');
const config = require('../knexfile.js');

async function fixMigrations() {
  const db = knex(config);
  
  try {
    // Check if migrations table exists
    const hasMigrationsTable = await db.schema.hasTable('knex_migrations');
    
    if (hasMigrationsTable) {
      console.log('knex_migrations table exists, checking for corrupt entries...');
      
      // Get all migrations that are marked as run
      const migrations = await db('knex_migrations').select('*');
      console.log('Current migrations in database:', migrations);
      
      // List all migration files in the migrations directory
      const fs = require('fs');
      const path = require('path');
      const migrationFiles = fs.readdirSync(path.join(__dirname, '../migrations'))
        .filter(file => file.endsWith('.js'));
      
      console.log('Migration files on disk:', migrationFiles);
      
      // Find any migrations in the database that don't have corresponding files
      const missingMigrations = migrations.filter(m => 
        !migrationFiles.includes(m.name)
      );
      
      if (missingMigrations.length > 0) {
        console.log('Found migrations in database without corresponding files:');
        console.log(missingMigrations.map(m => `- ${m.name}`).join('\n'));
        
        // Remove the missing migrations from the database
        for (const migration of missingMigrations) {
          console.log(`Removing missing migration: ${migration.name}`);
          await db('knex_migrations')
            .where({ name: migration.name })
            .delete();
        }
        
        console.log('Successfully cleaned up missing migrations.');
      } else {
        console.log('No missing migrations found in the database.');
      }
    } else {
      console.log('knex_migrations table does not exist. It will be created when you run your next migration.');
    }
    
    // Now run the migrations
    console.log('Running migrations...');
    await db.migrate.latest();
    console.log('Migrations completed successfully!');
    
  } catch (error) {
    console.error('Error fixing migrations:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

fixMigrations();

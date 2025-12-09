const knex = require('../knexfile.js');
const db = require('knex')(knex.development);

async function fixUsersTable() {
  try {
    // Check if users table exists
    const hasTable = await db.schema.hasTable('users');
    
    if (!hasTable) {
      console.log('Creating users table...');
      await db.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('email').notNullable().unique();
        table.string('password_hash').notNullable();
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.string('phone').notNullable();
        table.string('role').notNullable().defaultTo('customer');
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
      });
      console.log('Users table created successfully!');
    } else {
      console.log('Users table already exists. Checking structure...');
      
      // Check and add missing columns
      const columns = await db('users').columnInfo();
      
      if (!columns.first_name) {
        console.log('Adding first_name column...');
        await db.schema.alterTable('users', (table) => {
          table.string('first_name').notNullable().defaultTo('');
        });
      }
      
      if (!columns.last_name) {
        console.log('Adding last_name column...');
        await db.schema.alterTable('users', (table) => {
          table.string('last_name').notNullable().defaultTo('');
        });
      }
      
      if (!columns.phone) {
        console.log('Adding phone column...');
        await db.schema.alterTable('users', (table) => {
          table.string('phone').notNullable().defaultTo('');
        });
      }
      
      console.log('Users table is up to date!');
    }
    
    // List existing users
    const users = await db('users').select('id', 'email', 'first_name', 'last_name', 'role');
    console.log('\nCurrent users in database:');
    console.table(users);
    
  } catch (error) {
    console.error('Error fixing users table:', error);
  } finally {
    await db.destroy();
  }
}

fixUsersTable();

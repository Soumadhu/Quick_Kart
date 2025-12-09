const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function setupUsersTable() {
  try {
    console.log('Setting up users table...');
    
    // Create users table if it doesn't exist
    await db.schema.hasTable('users').then(async (exists) => {
      if (!exists) {
        console.log('Creating users table...');
        await db.schema.createTable('users', (table) => {
          table.increments('id').primary();
          table.string('email').unique().notNullable();
          table.string('password_hash').notNullable();
          table.string('first_name');
          table.string('last_name');
          table.string('phone');
          table.enu('role', ['admin', 'customer', 'rider']).defaultTo('customer');
          table.timestamps(true, true);
        });
        console.log('Users table created successfully');
      } else {
        console.log('Users table already exists');
      }
    });

    // Check if admin user exists
    const adminExists = await db('users').where({ email: 'admin@quickkart.com' }).first();
    
    if (!adminExists) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db('users').insert({
        email: 'admin@quickkart.com',
        password_hash: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      });
      
      console.log('✅ Admin user created with email: admin@quickkart.com and password: admin123');
    } else {
      console.log('Admin user already exists');
    }
    
    // List all users
    const users = await db('users').select('id', 'email', 'first_name', 'last_name', 'role');
    console.log('\nCurrent users:');
    console.table(users);
    
  } catch (error) {
    console.error('Error setting up users table:', error);
  } finally {
    // Close the database connection
    await db.destroy();
  }
}

setupUsersTable();

const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function resetUsersTable() {
  try {
    console.log('Dropping existing users table...');
    
    // Drop the existing users table if it exists
    await db.schema.dropTableIfExists('users');
    
    console.log('Creating new users table...');
    
    // Create the users table with the correct schema
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
    
    // Create admin user
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
    
    // List all users
    const users = await db('users').select('id', 'email', 'first_name', 'last_name', 'role');
    console.log('\nCurrent users:');
    console.table(users);
    
  } catch (error) {
    console.error('Error resetting users table:', error);
  } finally {
    // Close the database connection
    await db.destroy();
  }
}

resetUsersTable();

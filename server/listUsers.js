const db = require('./src/config/db');

async function listUsers() {
  try {
    console.log('Fetching users from database...');
    
    // Get all users (excluding passwords for security)
    const users = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'created_at');
    
    console.log('\nUsers in database:');
    console.log('------------------');
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.table(users);
    }
    
    // Check if the test user exists
    const testUser = users.find(u => u.email === 'madhubanidas2005@gmail.com');
    if (testUser) {
      console.log('\n✅ User found in database:', testUser);
    } else {
      console.log('\n❌ User not found in database');
    }
    
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    // Close the database connection
    db.destroy();
  }
}

listUsers();

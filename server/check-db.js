const knex = require('./src/config/db').knex();

async function checkDatabase() {
  try {
    // Test the database connection
    await knex.raw('SELECT 1');
    console.log('✅ Database connection successful');

    // Check if the riders table exists
    const tableExists = await knex.schema.hasTable('riders');
    console.log(`📊 Riders table exists: ${tableExists ? '✅' : '❌'}`);

    if (tableExists) {
      // Get table structure
      const columns = await knex('riders').columnInfo();
      console.log('\n📋 Riders table columns:');
      console.log(columns);

      // Count existing riders
      const count = await knex('riders').count('* as count').first();
      console.log(`\n👥 Total riders: ${count.count}`);
    }
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await knex.destroy();
    process.exit(0);
  }
}

checkDatabase();

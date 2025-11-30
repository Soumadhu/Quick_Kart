const knex = require('../src/config/db');

async function checkRidersTable() {
  try {
    // Check if the column exists
    const hasColumn = await knex.schema.hasColumn('riders', 'profile_picture');
    console.log('Has profile_picture column:', hasColumn);

    // Get table info
    const tableInfo = await knex('riders').columnInfo();
    console.log('Riders table columns:', Object.keys(tableInfo));

    // Get a sample rider to check structure
    const sampleRider = await knex('riders').first();
    console.log('Sample rider:', sampleRider);
  } catch (error) {
    console.error('Error checking riders table:', error);
  } finally {
    await knex.destroy();
  }
}

checkRidersTable();

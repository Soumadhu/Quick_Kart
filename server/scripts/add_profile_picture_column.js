// scripts/add_profile_picture_column.js
const knex = require('../src/config/db');

async function addProfilePictureColumn() {
  try {
    // Check if the column already exists
    const hasColumn = await knex.schema.hasColumn('riders', 'profile_picture');
    
    if (!hasColumn) {
      console.log('Adding profile_picture column to riders table...');
      await knex.schema.table('riders', function(table) {
        table.string('profile_picture', 255).nullable().after('vehicle_number');
      });
      console.log('Successfully added profile_picture column');
    } else {
      console.log('profile_picture column already exists');
    }
  } catch (error) {
    console.error('Error adding profile_picture column:', error.message);
  } finally {
    await knex.destroy();
  }
}

addProfilePictureColumn();
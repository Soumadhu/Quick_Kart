exports.up = function(knex) {
  return knex.raw(`
    ALTER TABLE riders 
    ADD COLUMN profile_picture VARCHAR(255) NULL 
    AFTER vehicle_number;
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    ALTER TABLE riders 
    DROP COLUMN profile_picture;
  `);
};

exports.up = function(knex) {
  return knex.schema.alterTable('riders', function(table) {
    table.string('profile_picture', 255).nullable().after('vehicle_model');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('riders', function(table) {
    table.dropColumn('profile_picture');
  });
};

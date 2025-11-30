exports.up = function(knex) {
  return knex.schema.createTable('riders', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('phone').notNullable().unique();
    table.string('password_hash').notNullable();
    table.boolean('is_available').defaultTo(true);
    table.decimal('current_lat', 10, 8);
    table.decimal('current_lng', 11, 8);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('riders');
};

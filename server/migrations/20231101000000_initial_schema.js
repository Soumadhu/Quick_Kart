exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.string('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('first_name');
    table.string('last_name');
    table.string('phone');
    table.string('role').notNullable().defaultTo('customer');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};

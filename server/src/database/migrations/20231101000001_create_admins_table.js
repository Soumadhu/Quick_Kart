exports.up = function(knex) {
  return knex.schema.createTable('admins', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('role', 50).defaultTo('admin');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at').nullable();
    table.timestamps(true, true);
    
    // Add index for faster lookups
    table.index(['email']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('admins');
};

exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Change id to auto-incrementing integer for SQLite compatibility
    table.increments('id').primary().alter();
    
    // Ensure all required columns exist
    table.string('email').notNullable().unique().alter();
    table.string('password_hash').notNullable().alter();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('phone').notNullable();
    table.string('role').notNullable().defaultTo('customer');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  // Note: SQLite doesn't support dropping columns, so this is a simplified rollback
  return knex.schema.alterTable('users', function(table) {
    table.string('id').alter();
  });
};

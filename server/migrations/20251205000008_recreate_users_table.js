exports.up = async function(knex) {
  // Drop existing users table if it exists
  await knex.schema.dropTableIfExists('users');
  
  // Create new users table with correct schema
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('phone').notNullable();
    table.string('role').notNullable().defaultTo('customer');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Add indexes
    table.index(['email']);
    table.index(['role']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};

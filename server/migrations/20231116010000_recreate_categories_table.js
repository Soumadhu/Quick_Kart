exports.up = function(knex) {
  return knex.schema.dropTableIfExists('categories')
    .then(() => {
      return knex.schema.createTable('categories', function(table) {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.text('description');
        table.text('image').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
      });
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable('categories');
};

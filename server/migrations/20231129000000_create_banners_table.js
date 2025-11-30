exports.up = function(knex) {
  return knex.schema.createTable('banners', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('subtitle');
    table.string('image_url').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.integer('display_order').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('banners');
};
exports.up = function(knex) {
  return knex.schema.table('categories', function(table) {
    table.text('image').nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.table('categories', function(table) {
    table.text('image').notNullable().alter();
  });
};

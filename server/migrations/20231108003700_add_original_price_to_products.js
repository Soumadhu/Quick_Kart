exports.up = function(knex) {
  return knex.schema.table('products', function(table) {
    table.decimal('original_price', 10, 2).nullable().after('price');
  });
};

exports.down = function(knex) {
  return knex.schema.table('products', function(table) {
    table.dropColumn('original_price');
  });
};

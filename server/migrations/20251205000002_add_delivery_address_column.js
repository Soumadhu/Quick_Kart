exports.up = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    // Add delivery_address as TEXT column
    table.text('delivery_address');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    table.dropColumn('delivery_address');
  });
};

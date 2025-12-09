exports.up = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    // Change delivery_address from jsonb to text
    table.text('delivery_address').alter();
    
    // Change items from jsonb to text
    table.text('items').alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    // Revert changes if needed
    table.jsonb('delivery_address').alter();
    table.jsonb('items').alter();
  });
};

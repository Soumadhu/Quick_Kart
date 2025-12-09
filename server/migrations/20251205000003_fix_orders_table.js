exports.up = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    // Add missing columns
    if (!knex.schema.hasColumn('orders', 'delivery_address')) {
      table.text('delivery_address');
    }
    if (!knex.schema.hasColumn('orders', 'order_number')) {
      table.string('order_number').unique();
    }
    if (!knex.schema.hasColumn('orders', 'total_amount')) {
      table.decimal('total_amount', 10, 2);
    }
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    // This is a one-way migration, but we'll provide a down function
    // that doesn't do anything to prevent data loss
  });
};

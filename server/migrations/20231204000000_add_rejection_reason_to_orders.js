exports.up = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    // Add rejection_reason column if it doesn't exist
    return knex.schema.hasColumn('orders', 'rejection_reason').then(exists => {
      if (!exists) {
        return table.text('rejection_reason').nullable();
      }
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    return table.dropColumn('rejection_reason');
  });
};

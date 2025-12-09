exports.up = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    table.enu('status', [
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'PENDING_ADMIN_DECISION',
      'ADMIN_ACCEPTED',
      'PREPARING',
      'READY_FOR_DELIVERY',
      'OUT_FOR_DELIVERY',
      'REJECTED_BY_ADMIN'
    ]).notNullable().defaultTo('PENDING');
    
    table.text('rejection_reason').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    table.dropColumn('rejection_reason');
  });
};

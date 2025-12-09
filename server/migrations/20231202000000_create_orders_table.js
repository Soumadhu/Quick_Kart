exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('order_number').unique().notNullable();
    table.decimal('total_amount', 10, 2).notNullable();
    
    // Status with default value
    table.enum('status', [
      'PENDING_ADMIN_DECISION',
      'ADMIN_ACCEPTED',
      'PREPARING',
      'READY_FOR_DELIVERY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REJECTED_BY_ADMIN'
    ]).notNullable().defaultTo('PENDING_ADMIN_DECISION');
    
    table.text('rejection_reason');
    table.jsonb('delivery_address').notNullable();
    table.jsonb('items').notNullable();
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id']);
    table.index(['status']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};

exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    // Primary key
    table.increments('id').primary();
    
    // User reference
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users')
      .onDelete('CASCADE');
      
    // Order details
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
    
    // Rejection details
    table.text('rejection_reason').nullable();
    
    // Address and items (stored as JSON)
    table.json('delivery_address').notNullable();
    table.json('items').notNullable();
    
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
  return knex.schema.dropTableIfExists('orders');
};

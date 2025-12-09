const knex = require('knex');
const config = require('./knexfile.js');
const db = knex(config.development);

async function fixOrdersTable() {
  try {
    console.log('Dropping existing orders table...');
    await db.schema.dropTableIfExists('orders');
    
    console.log('Creating new orders table...');
    await db.schema.createTable('orders', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('order_number').unique().notNullable();
      table.decimal('total_amount', 10, 2).notNullable();
      
      // Status with default value
      table.enu('status', [
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
      table.text('delivery_address');
      table.text('items');
      
      // Timestamps
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
      
      // Indexes
      table.index(['user_id']);
      table.index(['status']);
      table.index(['created_at']);
    });
    
    console.log('Orders table created successfully!');
  } catch (error) {
    console.error('Error fixing orders table:', error);
  } finally {
    await db.destroy();
  }
}

fixOrdersTable();

exports.up = async function(knex) {
  // First, check if the table exists
  const hasTable = await knex.schema.hasTable('order_items');
  
  if (!hasTable) {
    // If the table doesn't exist, create it with all necessary columns
    await knex.schema.createTable('order_items', function(table) {
      table.increments('id').primary();
      table.integer('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
      table.string('product_id').notNullable();
      table.string('name').notNullable();
      table.integer('quantity').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.decimal('total', 10, 2).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['order_id']);
      table.index(['product_id']);
    });
  } else {
    // If the table exists, add missing columns
    const columns = await knex('order_items').columnInfo();
    
    if (!columns.name) {
      await knex.schema.table('order_items', function(table) {
        table.string('name').after('product_id');
      });
    }
    
    if (!columns.price) {
      await knex.schema.table('order_items', function(table) {
        table.decimal('price', 10, 2).after('name');
      });
    }
    
    if (!columns.total) {
      await knex.schema.table('order_items', function(table) {
        table.decimal('total', 10, 2).after('price');
      });
    }
    
    if (!columns.created_at) {
      await knex.schema.table('order_items', function(table) {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
    }
    
    if (!columns.updated_at) {
      await knex.schema.table('order_items', function(table) {
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    }
  }
};

exports.down = function(knex) {
  // This is a one-way migration to fix the schema
  return Promise.resolve();
};

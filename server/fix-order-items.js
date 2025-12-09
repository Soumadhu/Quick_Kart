const knex = require('knex');
const config = require('./knexfile.js');
const db = knex(config.development);

async function fixOrderItemsTable() {
  try {
    console.log('Checking order_items table...');
    
    // Check if the table exists
    const hasTable = await db.schema.hasTable('order_items');
    
    if (!hasTable) {
      console.log('Creating order_items table...');
      await db.schema.createTable('order_items', function(table) {
        table.increments('id').primary();
        table.integer('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
        table.string('product_id').notNullable();
        table.string('name').notNullable();
        table.integer('quantity').notNullable();
        table.decimal('price', 10, 2).notNullable();
        table.decimal('total', 10, 2).notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('Created order_items table');
    } else {
      console.log('Altering order_items table...');
      
      // Get column info
      const columns = await db('order_items').columnInfo();
      
      // Add missing columns
      if (!columns.name) {
        console.log('Adding name column...');
        await db.schema.table('order_items', function(table) {
          table.string('name');
        });
      }
      
      if (!columns.total) {
        console.log('Adding total column...');
        await db.schema.table('order_items', function(table) {
          table.decimal('total', 10, 2);
        });
      }
      
      // Update product_id to be string type if it's not already
      if (columns.product_id && columns.product_id.type !== 'varchar(255)') {
        console.log('Updating product_id column type...');
        // SQLite doesn't support direct column type changes, so we need to recreate the table
        await db.schema.raw(`
          CREATE TABLE order_items_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id TEXT NOT NULL,
            name TEXT,
            quantity INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            total DECIMAL(10,2),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
          )
        `);
        
        // Copy data
        await db.schema.raw(`
          INSERT INTO order_items_new 
          (id, order_id, product_id, name, quantity, price, total, created_at, updated_at)
          SELECT 
            id, 
            order_id, 
            CAST(product_id AS TEXT) as product_id,
            'Unknown' as name,
            quantity,
            price,
            price * quantity as total,
            created_at,
            updated_at
          FROM order_items
        `);
        
        // Drop old table and rename new one
        await db.schema.dropTable('order_items');
        await db.schema.renameTable('order_items_new', 'order_items');
        
        // Recreate indexes
        await db.schema.table('order_items', function(table) {
          table.index(['order_id']);
          table.index(['product_id']);
        });
      }
      
      console.log('order_items table updated successfully');
    }
  } catch (error) {
    console.error('Error fixing order_items table:', error);
  } finally {
    await db.destroy();
  }
}

fixOrderItemsTable();

const knex = require('./src/config/db');

async function checkSchema() {
  try {
    console.log('Checking database connection...');
    
    // Check if orders table exists
    const hasTable = await knex.schema.hasTable('orders');
    console.log('Orders table exists:', hasTable);
    
    if (hasTable) {
      // For SQLite, we need to use a different approach to get table info
      const columns = await knex.raw('PRAGMA table_info(orders)');
      console.log('\nOrders table columns:');
      console.table(columns);
      
      // Get column names
      const columnNames = columns.map(col => col.name);
      console.log('Column names:', columnNames);
      
      // Check for required fields
      const requiredFields = ['user_id', 'total_amount', 'status'];
      const missingFields = requiredFields.filter(field => 
        !columnNames.includes(field)
      );
      
      if (missingFields.length > 0) {
        console.error('\nMissing required fields in orders table:', missingFields);
      } else {
        console.log('\nAll required fields are present');
      }
      
      // Show sample data
      const sample = await knex('orders').limit(1).first();
      console.log('\nSample order data:', sample);
    }
    
    // Check order_items table
    const hasItemsTable = await knex.schema.hasTable('order_items');
    console.log('\nOrder_items table exists:', hasItemsTable);
    
    if (hasItemsTable) {
      const itemsColumns = await knex.raw('PRAGMA table_info(order_items)');
      console.log('\nOrder_items table columns:');
      console.table(itemsColumns);
      
      // Check if we have any order items
      const itemCount = await knex('order_items').count('* as count').first();
      console.log('Number of order items:', itemCount.count);
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await knex.destroy();
  }
}

checkSchema();

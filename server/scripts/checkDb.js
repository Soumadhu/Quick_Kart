const knex = require('knex');
const config = require('../knexfile');

async function checkDatabase() {
  const db = knex(config.development);
  
  try {
    // Check if orders table exists
    const hasOrdersTable = await db.schema.hasTable('orders');
    console.log('Orders table exists:', hasOrdersTable);
    
    if (hasOrdersTable) {
      // Get table structure
      const columns = await db('orders').columnInfo();
      console.log('Orders table columns:', Object.keys(columns));
      
      // Check the status column definition
      const tableInfo = await db.raw('PRAGMA table_info(orders)');
      const statusColumn = tableInfo.find(col => col.name === 'status');
      
      if (statusColumn) {
        console.log('Status column details:', {
          name: statusColumn.name,
          type: statusColumn.type,
          notnull: statusColumn.notnull,
          dflt_value: statusColumn.dflt_value
        });
      }
      
      // Check if rejection_reason column exists
      const hasRejectionReason = await db.schema.hasColumn('orders', 'rejection_reason');
      console.log('Has rejection_reason column:', hasRejectionReason);
    }
    
    // Check knex_migrations table
    const hasMigrationsTable = await db.schema.hasTable('knex_migrations');
    console.log('knex_migrations table exists:', hasMigrationsTable);
    
    if (hasMigrationsTable) {
      const migrations = await db('knex_migrations').select('*');
      console.log('Applied migrations:', migrations.map(m => m.name));
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await db.destroy();
  }
}

checkDatabase();

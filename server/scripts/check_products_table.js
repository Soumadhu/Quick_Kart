const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './data/quickkart.sqlite3'
  },
  useNullAsDefault: true
});

async function checkTable() {
  try {
    // Check if table exists
    const tableExists = await knex.schema.hasTable('products');
    if (!tableExists) {
      console.log('Products table does not exist');
      return;
    }

    // Get table info
    const columns = await knex('products').columnInfo();
    console.log('Table columns:', Object.keys(columns));

    // Check if id is auto-incrementing
    console.log('Primary key info:');
    const primaryKeyInfo = await knex.raw("PRAGMA table_info(products)");
    const idColumn = primaryKeyInfo.find(col => col.pk === 1);
    console.log('ID column:', idColumn);

    // Try to insert a test record
    console.log('\nAttempting test insert...');
    const result = await knex('products').insert({
      name: 'test_product',
      description: 'test description',
      price: 10.99,
      stock: 5
    });
    
    console.log('Insert result:', result);
    
    // Get the last inserted row
    const lastRow = await knex('products')
      .orderBy('id', 'desc')
      .first();
      
    console.log('Last inserted row:', lastRow);
    
  } catch (error) {
    console.error('Error checking table:', error);
  } finally {
    await knex.destroy();
  }
}

checkTable();

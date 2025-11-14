const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './data/quickkart.sqlite3'
  },
  useNullAsDefault: true
});

async function addOriginalPriceColumn() {
  try {
    // Check if the column already exists
    const hasColumn = await knex.schema.hasColumn('products', 'original_price');
    
    if (!hasColumn) {
      console.log('Adding original_price column to products table...');
      await knex.schema.table('products', function(table) {
        table.decimal('original_price', 10, 2).nullable().after('price');
      });
      console.log('Successfully added original_price column');
    } else {
      console.log('original_price column already exists');
    }
    
    // Verify the column was added
    const columns = await knex('products').columnInfo();
    console.log('Current columns in products table:', Object.keys(columns));
    
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await knex.destroy();
  }
}

addOriginalPriceColumn();

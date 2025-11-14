const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './data/quickkart.sqlite3'
  },
  useNullAsDefault: true
});

async function listProducts() {
  try {
    console.log('Fetching all products...');
    const products = await knex('products').select('*');
    
    if (products.length === 0) {
      console.log('No products found in the database');
      return;
    }
    
    console.log(`\nFound ${products.length} products:`);
    console.table(products);
    
    // Show table structure
    console.log('\nTable structure:');
    const columns = await knex('products').columnInfo();
    console.log(columns);
    
  } catch (error) {
    console.error('Error listing products:', error);
  } finally {
    await knex.destroy();
  }
}

listProducts();

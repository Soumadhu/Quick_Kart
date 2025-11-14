const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './data/quickkart.sqlite3'
  },
  useNullAsDefault: true
});

async function updateProductsSchema() {
  try {
    // Check if the table exists
    const tableExists = await knex.schema.hasTable('products');
    if (!tableExists) {
      console.log('Creating products table...');
      await knex.schema.createTable('products', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('description');
        table.decimal('price', 10, 2).notNullable();
        table.decimal('original_price', 10, 2).nullable();
        table.string('unit', 10).defaultTo('pcs');
        table.string('image_url');
        table.integer('stock').defaultTo(0);
        table.decimal('rating', 2, 1).defaultTo(0);
        table.string('delivery_time');
        table.string('category');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
      console.log('Created products table with all required columns');
    } else {
      console.log('Updating products table...');
      
      // Add missing columns if they don't exist
      const columnsToAdd = [
        { name: 'original_price', type: 'decimal', options: { precision: 10, scale: 2, nullable: true } },
        { name: 'unit', type: 'string', options: { length: 10, defaultTo: 'pcs' } },
        { name: 'rating', type: 'decimal', options: { precision: 2, scale: 1, defaultTo: 0 } },
        { name: 'delivery_time', type: 'string' },
        { name: 'category', type: 'string' }
      ];

      for (const column of columnsToAdd) {
        const columnExists = await knex.schema.hasColumn('products', column.name);
        if (!columnExists) {
          console.log(`Adding column ${column.name} to products table...`);
          
          switch(column.type) {
            case 'decimal':
              await knex.schema.table('products', (table) => {
                const col = table.decimal(
                  column.name,
                  column.options.precision,
                  column.options.scale
                );
                if (column.options.defaultTo !== undefined) {
                  col.defaultTo(column.options.defaultTo);
                }
                if (column.options.nullable === false) {
                  col.notNullable();
                }
              });
              break;
              
            case 'string':
              await knex.schema.table('products', (table) => {
                const col = table.string(column.name, column.options?.length);
                if (column.options?.defaultTo !== undefined) {
                  col.defaultTo(column.options.defaultTo);
                }
              });
              break;
              
            default:
              console.warn(`Unhandled column type: ${column.type}`);
          }
          
          console.log(`Added column ${column.name}`);
        }
      }
      
      console.log('Products table schema is up to date');
    }
    
    // Verify the final schema
    const columns = await knex('products').columnInfo();
    console.log('Current columns in products table:', Object.keys(columns));
    
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await knex.destroy();
  }
}

updateProductsSchema();

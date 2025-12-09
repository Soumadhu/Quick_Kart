const knex = require('./src/config/db');

async function testOrderInsert() {
  try {
    // Test database connection
    await knex.raw('SELECT 1');
    console.log('Database connection successful');

    // Test order data
    const testOrder = {
      user_id: 1,
      total: 29.99,
      status: 'PENDING_ADMIN_DECISION',
      metadata: JSON.stringify({
        delivery_address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345'
        },
        payment_method: 'credit_card'
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Inserting test order:', testOrder);
    
    // Insert test order
    const [orderId] = await knex('orders').insert(testOrder);
    console.log('Test order inserted successfully with ID:', orderId);

    // Insert test order item
    const testItem = {
      order_id: orderId,
      product_id: 123,
      quantity: 2,
      price: 14.99,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await knex('order_items').insert(testItem);
    console.log('Test order item inserted successfully');

    // Verify the data
    const order = await knex('orders').where('id', orderId).first();
    const items = await knex('order_items').where('order_id', orderId);
    
    console.log('\nOrder from database:', order);
    console.log('Order items:', items);

  } catch (error) {
    console.error('Error during test:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
      stack: error.stack
    });
  } finally {
    await knex.destroy();
    process.exit();
  }
}

testOrderInsert();

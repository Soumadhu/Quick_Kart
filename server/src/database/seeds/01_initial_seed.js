exports.seed = async function(knex) {
  // Inserts seed entries (only if table is empty)
  const existingProducts = await knex('products').select('id').first();
  if (!existingProducts) {
    await knex('users').insert([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2a$10$XFDq4z1z5QKJ6b5V5v5X.e5V5X5V5X5V5X5V5X5V5X5V5X5V5X5V5X5V5X5V5', // hashed 'password'
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Test User',
        email: 'user@example.com',
        password: '$2a$10$XFDq4z1z5QKJ6b5V5v5X.e5V5X5V5X5V5X5V5X5V5X5V5X5V5X5V5X5V5X5V5', // hashed 'password'
        role: 'customer',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    await knex('products').insert([
      {
        name: 'Sample Product 1',
        description: 'This is a sample product',
        price: 19.99,
        stock: 100,
        image_url: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Sample Product 2',
        description: 'Another sample product',
        price: 29.99,
        stock: 50,
        image_url: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  }
};

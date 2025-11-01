exports.up = function(knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string('role').defaultTo('customer');
      table.timestamps(true, true);
    })
    .createTable('products', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.decimal('price', 10, 2).notNullable();
      table.integer('stock').defaultTo(0);
      table.string('image_url');
      table.timestamps(true, true);
    })
    .createTable('orders', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users');
      table.decimal('total', 10, 2).notNullable();
      table.string('status').defaultTo('pending');
      table.timestamps(true, true);
    })
    .createTable('order_items', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders');
      table.integer('product_id').unsigned().references('id').inTable('products');
      table.integer('quantity').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('order_items')
    .dropTableIfExists('orders')
    .dropTableIfExists('products')
    .dropTableIfExists('users');
};

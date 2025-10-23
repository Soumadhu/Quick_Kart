const db = require('../config/db');

class Product {
  static async create({ name, description, price, categoryId, sku, quantity = 0, isActive = true }) {
    const query = `
      INSERT INTO products (name, description, price, category_id, sku, quantity, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [name, description, price, categoryId, sku, quantity, isActive];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async findAll({ categoryId, search, page = 1, limit = 10 }) {
    let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id';
    const values = [];
    const conditions = [];
    
    if (categoryId) {
      conditions.push(`p.category_id = $${values.length + 1}`);
      values.push(categoryId);
    }
    
    if (search) {
      conditions.push(`p.name ILIKE $${values.length + 1}`);
      values.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY p.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const { rows } = await db.query(query, values);
    return rows;
  }

  static async update(id, updates) {
    const { name, description, price, categoryId, sku, quantity, isActive } = updates;
    const query = `
      UPDATE products 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          price = COALESCE($3, price),
          category_id = COALESCE($4, category_id),
          sku = COALESCE($5, sku),
          quantity = COALESCE($6, quantity),
          is_active = COALESCE($7, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      name, description, price, categoryId, sku, quantity, isActive, id
    ]);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING id';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async updateQuantity(id, quantityChange) {
    const query = `
      UPDATE products 
      SET quantity = quantity + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING quantity
    `;
    const { rows } = await db.query(query, [quantityChange, id]);
    return rows[0];
  }
}

module.exports = Product;

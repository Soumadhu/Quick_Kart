const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create({ email, password, firstName, lastName, phone, role = 'customer' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, phone, role, created_at, updated_at
    `;
    
    const values = [email, hashedPassword, firstName, lastName, phone, role];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async update(id, updates) {
    const { firstName, lastName, phone } = updates;
    const query = `
      UPDATE users 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone = COALESCE($3, phone),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, email, first_name, last_name, phone, role, created_at, updated_at
    `;
    const { rows } = await db.query(query, [firstName, lastName, phone, id]);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = User;

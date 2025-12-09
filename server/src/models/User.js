const { Model } = require('objection');
const knex = require('../config/db');
const bcrypt = require('bcryptjs');

// Initialize knex for Model
Model.knex(knex);

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email', 'password_hash'],
      properties: {
        id: { type: 'integer' },
        email: { type: 'string', format: 'email' },
        password_hash: { type: 'string' },
        first_name: { type: 'string', minLength: 1, maxLength: 100 },
        last_name: { type: 'string', minLength: 1, maxLength: 100 },
        phone: { type: 'string', maxLength: 20 },
        role: { 
          type: 'string', 
          enum: ['customer', 'admin', 'rider'],
          default: 'customer' 
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    // Use require() here to avoid circular dependency
    const Order = require('./Order');
    
    return {
      orders: {
        relation: Model.HasManyRelation,
        modelClass: Order,
        join: {
          from: 'users.id',
          to: 'orders.user_id'
        }
      }
    };
  }

  async $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = this.created_at;
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  // Find user by email
  static async findByEmail(email) {
    return await this.query().findOne({ email });
  }

  // Create new user with hashed password
  static async create(userData) {
    const { password, firstName, lastName, ...rest } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Create user with hashed password
    return await this.query().insert({
      ...rest,
      password_hash,
      first_name: firstName || '',
      last_name: lastName || '',
      role: 'customer' // Default role
    });
  }

  static async findById(id) {
    return this.query().findById(id);
  }

  async verifyPassword(password) {
    return bcrypt.compare(password, this.password_hash);
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

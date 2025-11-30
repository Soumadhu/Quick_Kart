const bcrypt = require('bcryptjs');
const { Model } = require('objection');
const db = require('../config/db');

// Initialize knex for the model
Model.knex(db);

class Rider extends Model {
  static get tableName() {
    return 'riders';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'email', 'phone', 'password', 'vehicle_number'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', format: 'email', maxLength: 255 },
        phone: { type: 'string', minLength: 10, maxLength: 255 },
        password: { type: 'string', minLength: 6 },
        vehicle_number: { type: 'string', minLength: 5, maxLength: 20 },
        is_active: { type: 'boolean', default: true },
        current_lat: { type: 'number' },
        current_lng: { type: 'number' },
        status: { type: 'string', enum: ['online', 'offline', 'busy'], default: 'offline' },
        last_login: { type: 'string', format: 'date-time' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  async $beforeInsert() {
    this.status = this.status || 'offline';
    this.is_active = this.is_active !== undefined ? this.is_active : true;
    
    // Hash password before inserting
    if (this.password) {
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
    
    // Let the database handle timestamps
    delete this.created_at;
    delete this.updated_at;
  }

  async $beforeUpdate() {
    // Hash password if it's being updated
    if (this.password) {
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
    
    // Let the database handle the updated_at timestamp
    delete this.updated_at;
  }

  // Method to verify password
  async verifyPassword(password) {
    return bcrypt.compare(password, this.password);
  }

  // Static method to find a rider by email
  static async findByEmail(email) {
    return this.query().findOne({ email });
  }

  // Static method to find a rider by phone
  static async findByPhone(phone) {
    return this.query().findOne({ phone });
  }
}

module.exports = Rider;
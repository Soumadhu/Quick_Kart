const { Model } = require('objection');
const knex = require('../config/db');

// Initialize knex for Model
Model.knex(knex);

class OrderItem extends Model {
  static get tableName() {
    return 'order_items';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['product_id', 'quantity', 'price'], // Removed order_id from required
      properties: {
        id: { type: 'integer' },
        order_id: { type: 'integer' }, // Not required in schema as it will be set on insert
        product_id: { type: 'string' }, // Removed UUID format requirement
        name: { type: 'string' },
        quantity: { type: 'integer', minimum: 1 },
        price: { type: 'number', minimum: 0 },
        total: { type: 'number', minimum: 0 },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Order = require('./Order');
    
    return {
      order: {
        relation: Model.BelongsToOneRelation,
        modelClass: Order,
        join: {
          from: 'order_items.order_id',
          to: 'orders.id'
        }
      }
    };
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = this.created_at;
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = OrderItem;

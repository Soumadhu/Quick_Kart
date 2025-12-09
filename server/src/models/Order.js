const { Model } = require('objection');
const knex = require('../config/db');

// Initialize knex for Model
Model.knex(knex);

// Add query debugging
knex.on('query', (query) => {
  console.log('SQL Query:', {
    sql: query.sql,
    bindings: query.bindings
  });
});

knex.on('query-error', (error, query) => {
  console.error('Query Error:', {
    error: error.message,
    sql: query?.sql,
    bindings: query?.bindings,
    stack: error.stack
  });
});

class Order extends Model {
  static get tableName() {
    return 'orders';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'total_amount', 'status', 'delivery_address'],
      properties: {
        id: { type: ['string', 'number'] },
        user_id: { 
          type: ['string', 'number'], // Accept both string and number
          anyOf: [
            { type: 'string' },
            { type: 'number' }
          ]
        },
        order_number: { type: 'string' },
        total_amount: { type: 'number' },
        status: { 
          type: 'string', 
          enum: [
            'PENDING_ADMIN_DECISION',
            'ADMIN_ACCEPTED',
            'PREPARING',
            'READY_FOR_DELIVERY',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'CANCELLED',
            'REJECTED_BY_ADMIN'
          ],
          default: 'PENDING_ADMIN_DECISION' 
        },
        rejection_reason: { type: 'string' },
        delivery_address: { 
          anyOf: [
            { type: 'object' },
            { type: 'string' } // Allow string for already stringified objects
          ]
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product_id: { type: 'string' }, // Removed UUID format requirement
              name: { type: 'string' },
              quantity: { type: 'integer', minimum: 1 },
              price: { type: 'number', minimum: 0 },
              total: { type: 'number', minimum: 0 }
            }
          }
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    // Use require() here to avoid circular dependency
    const User = require('./User');
    const OrderItem = require('./order-item');
    
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'orders.user_id',
          to: 'users.id'
        }
      },
      items: {
        relation: Model.HasManyRelation,
        modelClass: OrderItem,
        join: {
          from: 'orders.id',
          to: 'order_items.order_id'
        }
      }
    };
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext);
    this.created_at = new Date().toISOString();
    this.updated_at = this.created_at;
    
    // Generate order number if not provided
    if (!this.order_number) {
      this.order_number = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    // Ensure user_id is a number (since that's what the database expects)
    if (this.user_id) {
      this.user_id = parseInt(this.user_id, 10);
    }
    
    // Ensure rejection_reason is a string
    if (this.rejection_reason && typeof this.rejection_reason === 'object') {
      this.rejection_reason = JSON.stringify(this.rejection_reason);
    }
    
    // Ensure delivery_address is a string for storage
    if (this.delivery_address) {
      if (typeof this.delivery_address === 'object') {
        this.delivery_address = JSON.stringify(this.delivery_address);
      }
      // If it's already a string, we assume it's valid JSON
    } else {
      // If delivery_address is not provided, set a default empty object
      this.delivery_address = '{}';
    }
  }

  $beforeUpdate() {
    try {
      this.updated_at = new Date().toISOString();
    } catch (error) {
      console.error('Error in $beforeUpdate:', error);
      throw error;
    }
  }
  
  // Add error handling for all queries
  $beforeFind(queryContext) {
    queryContext.onError = (error) => {
      console.error('Database query error in Order model:', {
        message: error.message,
        sql: error.nativeError?.sql,
        parameters: error.nativeError?.parameters,
        stack: error.stack
      });
      throw error;
    };
  }
}

module.exports = Order;

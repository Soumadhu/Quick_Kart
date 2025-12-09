const express = require('express');
const router = express.Router();
const Order = require('../../models/Order'); // Ensure consistent case

console.log('Orders route file loaded');

// Get all orders with optional status filter
router.get('/', async (req, res) => {
  console.log('GET /api/orders endpoint hit');
  try {
    const { status } = req.query;
    console.log('Query params:', { status });
    
    // Build the base query without relations first
    let query = Order.query();
    
    // Apply status filter if provided
    if (status) {
      query = query.where('status', status);
    }
    
    console.log('Executing query...');
    
    // Execute the query with error handling
    const orders = await query
      .orderBy('created_at', 'DESC')
      .catch(error => {
        console.error('Database query error:', error);
        throw new Error('Failed to execute database query');
      });
      
    console.log(`Found ${orders.length} orders`);
    
    // Ensure we're sending back a proper array
    res.json(Array.isArray(orders) ? orders : []);
    
  } catch (error) {
    console.error('Error in GET /api/orders:', {
      message: error.message,
      stack: error.stack,
      query: error.query
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        query: error.query 
      })
    });
  }
});

// Get order by ID with user details
router.get('/:id', async (req, res) => {
  const orderId = req.params.id;
  console.log(`Fetching order with ID: ${orderId}`);
  
  try {
    const order = await Order.query()
      .findById(orderId)
      .catch(error => {
        console.error('Database query error:', error);
        throw new Error('Failed to execute database query');
      });
      
    if (!order) {
      console.log(`Order not found with ID: ${orderId}`);
      return res.status(404).json({ 
        error: 'Order not found',
        details: `No order found with ID: ${orderId}`
      });
    }
    
    console.log(`Successfully retrieved order: ${orderId}`);
    res.json(order);
    
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch order',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Create a new order with items
router.post('/', async (req, res) => {
  const trx = await Order.startTransaction();
  
  try {
    console.log('Creating new order with data:', JSON.stringify(req.body, null, 2));
    
    // Basic validation
    if (!req.body.user_id) {
      console.warn('Missing required field: user_id');
      return res.status(400).json({ 
        error: 'Validation error',
        details: 'user_id is required'
      });
    }

    // Extract items from the request
    const { items = [], ...orderData } = req.body;
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Generate a valid UUID v4 for user_id if not provided
    const userId = orderData.user_id || '00000000-0000-4000-a000-000000000001';
    
    // Prepare order data to match the exact database schema
    const orderToInsert = {
      user_id: String(userId), // Ensure user_id is a string for validation
      order_number: orderNumber,
      total_amount: orderData.total_amount || 0,
      status: orderData.status || 'PENDING_ADMIN_DECISION',
      rejection_reason: JSON.stringify({
        delivery_address: orderData.delivery_address,
        payment_method: orderData.payment_method,
        original_order_number: orderNumber
      }),
      // Pass the delivery_address as is - the model will handle stringification
      delivery_address: orderData.delivery_address || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Inserting order with data:', JSON.stringify(orderToInsert, null, 2));
    
    let order;
    try {
      // Create a new order instance to trigger validation
      const orderInstance = Order.fromJson(orderToInsert);
      
      console.log('Inserting order...');
      // Convert to JSON strings right before insertion
      const orderToInsertDb = {
        ...orderToInsert,
        delivery_address: JSON.stringify(orderToInsert.delivery_address),
        items: JSON.stringify(orderToInsert.items)
      };
      
      // Insert the order with items in a transaction
      order = await Order.transaction(trx, async (trx) => {
        // First insert the order - let the model handle the delivery_address
        const insertedOrder = await Order.query(trx).insert(orderToInsert);
        
        // Then insert order items if any
        if (items && items.length > 0) {
          const orderItems = items.map(item => ({
            order_id: insertedOrder.id,
            product_id: item.product_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          }));
          
          await trx('order_items').insert(orderItems);
        }
        
        return insertedOrder;
      });
      console.log('Order inserted successfully:', JSON.stringify(order, null, 2));
    } catch (error) {
      console.error('Database insert error:', {
        message: error.message,
        nativeError: error.nativeError,
        stack: error.stack,
        code: error.code,
        errno: error.errno,
        sqlMessage: error.nativeError?.message,
        sql: error.nativeError?.sql
      });
      throw new Error(`Failed to insert order: ${error.message}`);
    }
    
    console.log('Order created successfully:', order.id);
    
    // If there are items, insert them into order_items table
    if (items && items.length > 0) {
      try {
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: parseInt((item.product_id || '').replace(/\D/g, '') || '0'),
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        console.log('Inserting order items:', orderItems);
        await trx('order_items').insert(orderItems);
        console.log(`Added ${orderItems.length} items to order ${order.id}`);
      } catch (error) {
        console.error('Error adding items to order:', {
          orderId: order.id,
          error: error.message,
          stack: error.stack
        });
        throw new Error(`Failed to add items to order: ${error.message}`);
      }
    }
    
    // Commit the transaction
    await trx.commit();
    
    // Get the complete order with items
    const completeOrder = await Order.query()
      .findById(order.id)
      .withGraphFetched('items');
    
    // Emit new order event to admin if WebSocket is available
    if (req.app.get('io')) {
      req.app.get('io').to('admin_room').emit('new_order', completeOrder);
    } else {
      console.warn('WebSocket not available for order notification');
    }
    
    res.status(201).json(completeOrder);
    
  } catch (error) {
    // Rollback the transaction in case of error
    if (trx) {
      await trx.rollback();
    }
    
    const errorDetails = {
      message: error.message,
      stack: error.stack
    };
    
    // Add more details for specific error types
    if (error.nativeError) {
      errorDetails.nativeError = {
        code: error.nativeError.code,
        errno: error.nativeError.errno,
        sqlMessage: error.nativeError.sqlMessage,
        sql: error.nativeError.sql
      };
    }
    
    console.error('Error creating order:', errorDetails);
    
    const response = { 
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Failed to process order'
    };
    
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        error: errorDetails,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      };
    }
    
    res.status(400).json(response);
  }
});

// Accept an order
router.post('/:id/accept', async (req, res) => {
  const db = Order.knex();
  
  try {
    // Check if order exists using SQLite raw query
    const order = await db.raw('SELECT id FROM orders WHERE id = ?', [req.params.id]);
    
    if (!order || order.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status using SQLite raw query
    const updatedAt = new Date().toISOString();
    await db.raw(`
      UPDATE orders 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `, ['ADMIN_ACCEPTED', updatedAt, req.params.id]);

    // Get the updated order
    const [updatedOrder] = await db.raw(`
      SELECT id, status, updated_at 
      FROM orders 
      WHERE id = ?
    `, [req.params.id]);

    // Emit WebSocket updates
    const io = req.app.get('io');
    io.to(`order_${req.params.id}`).emit('order_status_updated', {
      orderId: req.params.id,
      status: 'ADMIN_ACCEPTED',
      updatedAt: updatedAt
    });
    
    io.to('admin_room').emit('order_updated', {
      id: updatedOrder.id,
      status: updatedOrder.status,
      updated_at: updatedOrder.updated_at
    });
    
    // Send response
    res.json({
      id: updatedOrder.id,
      status: updatedOrder.status,
      updated_at: updatedOrder.updated_at
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(400).json({ 
      error: 'Failed to accept order',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message,
        stack: error.stack
      })
    });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  const { status, rejectionReason } = req.body;
  
  try {
    const order = await Order.query().findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updatedOrder = await Order.query().patchAndFetchById(req.params.id, {
      status,
      ...(rejectionReason && { rejection_reason: rejectionReason }),
      updated_at: new Date().toISOString()
    });
    
    // Emit status update event
    const io = req.app.get('io');
    io.to(`order_${order.id}`).emit('order_status_updated', {
      orderId: order.id,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updated_at
    });
    
    // Also update admin room
    io.to('admin_room').emit('order_updated', updatedOrder);
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({ error: 'Failed to update order status' });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      preparingOrders,
      outForDeliveryOrders,
      completedOrders,
      totalRevenue
    ] = await Promise.all([
      Order.query().resultSize(),
      Order.query().where('status', 'PENDING_ADMIN_DECISION').resultSize(),
      Order.query().where('status', 'PREPARING').resultSize(),
      Order.query().where('status', 'OUT_FOR_DELIVERY').resultSize(),
      Order.query().where('status', 'DELIVERED').resultSize(),
      Order.query().sum('total_amount as total').first()
    ]);
    
    res.json({
      totalOrders,
      pendingOrders,
      preparingOrders,
      outForDeliveryOrders,
      completedOrders,
      totalRevenue: parseFloat(totalRevenue.total) || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;

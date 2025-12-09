const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const { io } = require('../server');
const adminSockets = new Map(); // Track admin sockets

// Create a new order
const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { user_id, items, delivery_address, total_amount } = req.body;
    
    // Create the order with initial status
    const order = await Order.query().insert({
      user_id,
      items,
      delivery_address,
      total_amount,
      status: 'PENDING_ADMIN_DECISION'
    });

    // Emit event for admin notification with full order details
    const orderWithItems = await Order.query()
      .findById(order.id)
      .withGraphFetched('[items.product, user]');
      
    // Prepare order data for emission
    const orderData = {
      ...orderWithItems,
      order_id: order.id,
      id: order.id,
      order_number: order.order_number,
      created_at: order.created_at,
      updated_at: order.updated_at,
      status: 'PENDING_ADMIN_DECISION',
      // Ensure we have user data for the notification
      user: orderWithItems.user || { name: 'Customer' },
      // Add customer name directly for easier access
      customer_name: orderWithItems.user?.name || 'Customer',
      // Add total amount
      total_amount: order.total_amount
    };
    
    console.log('Emitting new_order event with data:', JSON.stringify(orderData, null, 2));
    
    // Emit to admin room
    io.emit('new_order', orderData); // Emit to all connected clients
    
    // Also emit specifically to admin room
    io.to('admin_room').emit('new_order', orderData);
    
    // Also emit to order-specific room for real-time updates
    io.to(`order_${order.id}`).emit('order_status_update', {
      orderId: order.id,
      status: 'PENDING_ADMIN_DECISION'
    });
    
    console.log('Emitted new_order event for order:', order.id, 'to admin_room and order room');

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order placed successfully. Waiting for admin approval.'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Admin accepts an order
const acceptOrder = async (req, res) => {
  const { orderId } = req.params;
  
  try {
    const order = await Order.query().findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    if (order.status !== 'PENDING_ADMIN_DECISION') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept order with status: ${order.status}`
      });
    }
    
    // Update order status to PREPARING
    const updatedOrder = await Order.query().patchAndFetchById(orderId, {
      status: 'PREPARING',
      updated_at: new Date().toISOString()
    });
    
    // Get the full order with relationships
    const fullOrder = await Order.query()
      .findById(orderId)
      .withGraphFetched('[items.product, user]');

    // Emit order status update to order-specific room and admin namespace
    const adminNamespace = io.of('/admin');
    
    // Emit to order room for real-time updates
    io.to(`order_${orderId}`).emit('order_status_update', {
      orderId,
      status: 'PROCESSING',
      updatedAt: order.updated_at
    });
    
    // Notify admin namespace about the update
    adminNamespace.emit('order_updated', order);
    
    res.json({
      success: true,
      data: order,
      message: 'Order has been accepted and is being processed.'
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept order',
      error: error.message
    });
  }
};

// Admin rejects an order
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const order = await Order.query().findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    if (order.status !== 'PENDING_ADMIN_DECISION') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject order with status: ${order.status}`
      });
    }
    
    // Update order status to rejected with reason
    const updatedOrder = await Order.query().patchAndFetchById(orderId, {
      status: 'REJECTED_BY_ADMIN',
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    });
    
    // Notify user and admin
    io.emit('order_updated', {
      order_id: updatedOrder.id,
      status: updatedOrder.status,
      rejection_reason: updatedOrder.rejection_reason,
      updated_at: updatedOrder.updated_at
    });
    
    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject order',
      error: error.message
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { user } = req;
    
    const order = await Order.query()
      .findById(orderId)
      .withGraphFetched('user');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Ensure the user has access to this order
    if (user.role !== 'admin' && order.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Get orders for admin
const getOrdersForAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = Order.query()
      .withGraphFetched('[user, items.product]')
      .orderBy('created_at', 'DESC');
    
    if (status) {
      query = query.where('status', status);
    }
    
    // Clone the query for counting total
    const countQuery = query.clone();
    
    // Get paginated results
    const orders = await query
      .limit(limit)
      .offset(offset);
      
    // Get total count
    const [total] = await countQuery.count('* as count');
    const totalCount = parseInt(total.count, 10);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  acceptOrder,
  rejectOrder,
  getOrderById,
  getOrdersForAdmin
};

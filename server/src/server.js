const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { port } = require('../config');
const jwt = require('jsonwebtoken');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS enabled for development
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  // Enable WebSocket transport with fallback to polling
  transports: ['websocket', 'polling'],
  // Enable connection state recovery
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
  // Add ping/pong timeouts
  pingTimeout: 10000,
  pingInterval: 25000,
  // Enable HTTP long-polling
  allowEIO3: true,
  // Enable CORS for all origins
  allowRequest: (req, callback) => {
    callback(null, true);
  }
});

// Log connection events
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', err);
});

io.engine.on('headers', (headers) => {
  headers['Access-Control-Allow-Origin'] = '*';
  headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
});

// Track connected users and admin connections
const connectedUsers = new Map(); // email -> { socketId, userData, isAdmin }
const adminSockets = new Map();   // socketId -> socket

// Socket.IO middleware for authentication
io.use((socket, next) => {
  // Get token from handshake or query
  const token = socket.handshake.auth?.token || 
               socket.handshake.query?.token ||
               (socket.handshake.headers.authorization || '').split(' ')[1];
  
  // For admin_online event, we'll handle auth in the event handler
  if (socket.handshake._query?.isAdmin === 'true') {
    socket.isAdmin = true;
    return next();
  }
  
  if (!token) {
    console.log('No token provided, allowing connection for public events');
    return next();
  }
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Attach user data to socket
    console.log(`User ${decoded.email} authenticated with role ${decoded.role}`);
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Handle all WebSocket connections
io.on('connection', (socket) => {
  console.log('New connection:', socket.id, 'User:', socket.user?.email || 'anonymous');
  
  // Handle admin online notification
  socket.on('admin_online', async ({ token }) => {
    console.log('Admin online event received, token length:', token?.length || 0);
    
    try {
      if (!token) {
        throw new Error('No token provided');
      }
      
      // Verify admin token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.role !== 'admin') {
        throw new Error('User is not an admin');
      }
      
      // Clean up any existing connection for this user
      const existingUser = connectedUsers.get(decoded.email);
      if (existingUser) {
        console.log(`Existing connection found for ${decoded.email}, cleaning up...`);
        const existingSocket = io.sockets.sockets.get(existingUser.socketId);
        if (existingSocket) {
          existingSocket.disconnect(true);
          console.log(`Disconnected existing socket ${existingUser.socketId} for ${decoded.email}`);
        }
        connectedUsers.delete(decoded.email);
      }
      
      // Store admin socket
      adminSockets.set(socket.id, socket);
      socket.user = decoded;
      socket.isAdmin = true;
      
      // Track the admin user
      connectedUsers.set(decoded.email, {
        socketId: socket.id,
        userData: decoded,
        isAdmin: true,
        connectedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });
      
      console.log(`Admin ${decoded.email} connected with socket ID: ${socket.id}`);
      
      // Join admin room
      socket.join('admin_room');
      console.log(`Admin ${socket.id} joined admin_room`);
      
      // Send ack to client
      socket.emit('admin_authenticated', {
        message: 'Successfully authenticated as admin',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
      
      // Send a test message
      socket.emit('test_event', { 
        message: 'Successfully connected to admin room',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Admin authentication failed:', error.message);
      socket.emit('admin_auth_error', { 
        message: 'Authentication failed',
        error: error.message 
      });
      socket.disconnect();
    }
  });
  
  // Handle admin joining admin room (backward compatibility)
  socket.on('join_admin_room', () => {
    if (socket.isAdmin) {
      socket.join('admin_room');
      console.log('Admin joined admin_room:', socket.id);
    }
  });

  // Handle new orders (broadcast to all admins)
  socket.on('new_order', (order) => {
    console.log('New order received:', order.id);
    // Broadcast to all admins in the admin_room
    const adminRoom = io.sockets.adapter.rooms.get('admin_room');
    console.log('Broadcasting to admin_room. Current admin count:', adminRoom?.size || 0);
    
    if (adminRoom) {
      io.to('admin_room').emit('new_order', order);
      io.to('admin_room').emit('test_event', { 
        message: 'New order notification test',
        orderId: order.id,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('No admins currently in admin_room to receive order');
    }
  });

  // Handle status updates from admin
  socket.on('order_status_update', (data) => {
    if (!socket.isAdmin) {
      console.warn('Non-admin attempt to update order status:', socket.id);
      return;
    }
    
    // Emit to specific order room and admin room
    io.to(`order_${data.orderId}`).emit('order_status_update', {
      orderId: data.orderId,
      status: data.status,
      updatedBy: socket.user?.email || 'admin',
      timestamp: new Date().toISOString()
    });
    
    // Also update all admins
    io.to('admin_room').emit('admin_order_updated', {
      orderId: data.orderId,
      status: data.status,
      updatedBy: socket.user?.email || 'admin',
      timestamp: new Date().toISOString()
    });
  });

  // Subscribe to order updates
  socket.on('subscribe', ({ orderId }) => {
    socket.join(`order_${orderId}`);
    console.log(`Client ${socket.id} subscribed to order ${orderId}`);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const userEmail = socket.user?.email;
    console.log(`Client disconnected: ${socket.id} User: ${userEmail || 'anonymous'} Reason: ${reason}`);
    
    // Clean up admin connections
    adminSockets.delete(socket.id);
    
    // Clean up user tracking
    if (userEmail) {
      const userInfo = connectedUsers.get(userEmail);
      if (userInfo && userInfo.socketId === socket.id) {
        connectedUsers.delete(userEmail);
        console.log(`Removed user ${userEmail} from connected users`);
      }
    }
    
    // Leave all rooms on disconnect
    if (socket.rooms) {
      const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      if (rooms.length > 0) {
        console.log(`User ${userEmail || socket.id} left rooms:`, rooms);
        rooms.forEach(room => socket.leave(room));
      }
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io accessible to other modules
app.set('io', io);

// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`WebSocket server is running on ws://localhost:${port}`);
  console.log('WebSocket namespaces:', [...io._nsps.keys()]);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = server;

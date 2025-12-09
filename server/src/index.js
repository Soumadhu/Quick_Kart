require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const createCategoryRoutes = require('./routes/api/categories');
const riderRoutes = require('./routes/riderRoutes');
const { default: ip } = require('ip');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Allowed origins
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:19006',
  'exp://192.168.0.*:*',
  'http://localhost:3000',
  'http://192.168.0.100:5000',
  'http://192.168.0.100:19006',
  'http://192.168.0.100:8081',
  'http://192.168.0.102:5000',
  'http://192.168.0.102:19006',
  'http://192.168.0.103:5000',
  'http://192.168.0.103:19006',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:19006'
];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, false);
    
    if (allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp('^' + allowedOrigin.replace(/\./g, '\\\\.').replace(/\*/g, '.*'));
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    })) {
      callback(null, origin);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'X-Requested-With',
    'Accept',
    'X-Access-Token',
    'X-Refresh-Token',
    'Pragma',
    'Accept-Language',
    'Accept-Encoding',
    'Connection',
    'Host',
    'Origin',
    'Referer',
    'User-Agent'
  ],
  exposedHeaders: [
    'Content-Length',
    'X-Access-Token',
    'X-Refresh-Token'
  ],
  credentials: true,  // Important for cookies, authorization headers
  maxAge: 86400,      // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware to Express
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Initialize Socket.IO with proper CORS configuration
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    allowedHeaders: corsOptions.allowedHeaders,
    credentials: corsOptions.credentials
  },
  transports: ['websocket', 'polling'],
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// Make io accessible to other modules
app.set('io', io);

// Debug request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route is working!', timestamp: new Date().toISOString() });
});

const jwt = require('jsonwebtoken');

// WebSocket authentication middleware
io.use((socket, next) => {
  // Get token from handshake or query
  const token = socket.handshake.auth?.token || 
               socket.handshake.query?.token ||
               (socket.handshake.headers.authorization || '').split(' ')[1];
  
  if (!token) {
    console.log('No token provided, connection rejected');
    return next(new Error('Authentication error: No token provided'));
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

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('New WebSocket client connected:', socket.id, 'User:', socket.user?.email);
  
  // Join admin room if user is admin
  if (socket.user?.role === 'admin') {
    socket.join('admin_room');
    console.log(`Admin ${socket.user.email} joined admin_room`);
  }
  
  // Handle admin online status
  socket.on('admin_online', () => {
    if (socket.user?.role === 'admin') {
      socket.join('admin_room');
      console.log(`Admin ${socket.user.email} is now online`);
      socket.emit('admin_online_ack', { status: 'online' });
    }
  });
  
  // Handle order status updates
  socket.on('order_status_update', (data) => {
    if (socket.user?.role === 'admin') {
      const { orderId, status } = data;
      console.log(`Order ${orderId} status updated to ${status} by ${socket.user.email}`);
      
      // Broadcast to relevant rooms
      socket.to(`order_${orderId}`).emit('order_updated', { 
        orderId, 
        status,
        updatedBy: socket.user.email,
        timestamp: new Date()
      });
      
      // Also update admin room
      socket.to('admin_room').emit('admin_order_updated', { 
        orderId, 
        status,
        updatedBy: socket.user.email,
        timestamp: new Date()
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'User:', socket.user?.email, 'Reason:', reason);
    
    // Leave all rooms on disconnect
    if (socket.rooms) {
      socket.rooms.forEach(room => {
        if (room !== socket.id) { // Don't leave default room
          socket.leave(room);
          console.log(`User ${socket.user?.email} left room ${room}`);
        }
      });
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('WebSocket error for user', socket.user?.email, ':', error);
  });
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
const publicPath = path.join(__dirname, '..', 'public');
const uploadsPath = path.join(publicPath, 'uploads');

// Create directories if they don't exist
if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

console.log('Serving static files from:', publicPath);
console.log('Uploads directory:', uploadsPath);

// Serve static files
app.use(express.static(publicPath));
app.use('/uploads', express.static(uploadsPath));

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'API is working' });
});

// Initialize database and setup routes
const setupRoutes = async () => {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('Database connection successful');
    
    // Initialize API routes with database connection
    const apiRouter = express.Router();
    
    // Mount routes
    apiRouter.use('/products', productRoutes);
    
    // Mount category routes with database connection
    const categoryRoutes = createCategoryRoutes(db);
    apiRouter.use('/categories', categoryRoutes);
    
    // Mount rider routes
    apiRouter.use('/riders', riderRoutes);
    
    // Mount orders routes
    const orderRoutes = require('./routes/api/orders');
    apiRouter.use('/orders', orderRoutes);
    
    // Mount auth routes
    const authRoutes = require('./routes/authRoutes');
    apiRouter.use('/auth', authRoutes);
    
    // Mount the API router
    app.use('/api', apiRouter);
    
    // 404 handler for API routes
    app.use('/api/*', (req, res) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });
    
    console.log('API routes initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize routes:', error);
    throw error;
  }
};

// Start the server
const startServer = async () => {
  try {
    await setupRoutes();
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n=== Server Started ===`);
      console.log(`Local:    http://localhost:${PORT}`);
      console.log(`WebSocket: ws://localhost:${PORT}`);
      try {
        console.log(`Network:  http://${ip.address()}:${PORT}`);
        console.log(`WebSocket (Network): ws://${ip.address()}:${PORT}`);
      } catch (e) {
        console.log('Could not determine network IP address');
      }
      console.log(`API Base: http://localhost:${PORT}/api`);
      console.log(`Database: sqlite3 (${process.env.DB_FILE || './data/quickkart.sqlite3'})`);
      console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log('========================\n');
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(err => {
  console.error('Fatal error during server startup:', err);
  process.exit(1);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// List files in uploads directory
app.get('/list-uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsPath);
    res.json({
      uploadsPath,
      files: files.map(file => ({
        name: file,
        path: path.join(uploadsPath, file),
        url: `/uploads/${file}`,
      }))
    });
  } catch (error) {
    console.error('Error reading uploads directory:', error);
    res.status(500).json({ 
      error: 'Failed to read uploads directory',
      details: error.message,
      uploadsPath
    });
  }
});

// Error handling middleware for file uploads
const multer = require('multer');
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }
  next(err);
});

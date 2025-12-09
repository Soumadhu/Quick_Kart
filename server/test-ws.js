// test-ws.js
const { io } = require('socket.io-client');

// Your token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBxdWlja2thcnQuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY0ODcwNjMyLCJleHAiOjE3Njc0NjI2MzJ9.pu1DJiIcyswKFRSLFiNNWxDYJx7ckOseHreCXg9jcm0';

console.log('🔑 Using token:', token.substring(0, 10) + '...');
console.log('Initializing WebSocket connection...');

// Create WebSocket connection
const socket = io('http://localhost:5000', {
  path: '/socket.io',
  transports: ['websocket', 'polling'], // Added polling as fallback
  query: {
    token: token,
    isAdmin: 'true',
    EIO: '3'
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  forceNew: true,
  autoConnect: true,
  withCredentials: true,
  rejectUnauthorized: false
});

// Connection event handlers
socket.on('connect', () => {
  console.log('\n✅ WebSocket connected!');
  console.log('Socket ID:', socket.id);
  
  // Send admin authentication
  console.log('Sending admin_online event...');
  socket.emit('admin_online', { token }, (response) => {
    if (response?.error) {
      console.error('❌ Admin authentication failed:', response.error);
    } else {
      console.log('✅ Admin authentication successful!');
      console.log('\nWebSocket connection is working correctly!');
      console.log('\nListening for real-time updates...');
    }
  });
});

socket.on('connect_error', (error) => {
  console.error('\n❌ WebSocket connection error:', error.message);
  console.error('Error details:', error);
  
  // Additional troubleshooting tips
  console.log('\nTroubleshooting tips:');
  console.log('1. Make sure your server is running');
  console.log('2. Check if the server URL is correct (http://localhost:5000)');
  console.log('3. Verify the token is still valid');
  console.log('4. Check server logs for any errors');
});

socket.on('disconnect', (reason) => {
  console.log('\nℹ️  Disconnected:', reason);
  if (reason === 'io server disconnect') {
    console.log('Server intentionally closed the connection');
  }
});

socket.on('admin_authenticated', () => {
  console.log('✅ Server confirmed admin authentication');});

socket.on('new_order', (order) => {
  console.log('\n📦 New order received:', order);
});

// Handle any other events
socket.onAny((event, ...args) => {
  if (event !== 'heartbeat') { // Filter out heartbeat events
    console.log(`\n🔔 Event [${event}]:`, ...args);
  }
});

// Keep the process running
console.log('\nWebSocket test running. Press Ctrl+C to exit...');

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nClosing WebSocket connection...');
  socket.disconnect();
  process.exit();
});

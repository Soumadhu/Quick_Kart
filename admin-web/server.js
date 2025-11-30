const express = require('express');
const app = express();

// Configuration
const PORT = process.env.PORT || 3002;
const TARGET_URL = 'http://localhost:8081/admin';

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Redirect all routes to the admin panel
app.get('*', (req, res) => {
  const targetUrl = new URL(req.originalUrl, TARGET_URL).toString();
  console.log(`Redirecting to: ${targetUrl}`);
  res.redirect(targetUrl);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Error loading the admin panel');
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Admin panel redirector running on: http://localhost:${PORT}`);
  console.log(`🔗 All traffic will be redirected to: ${TARGET_URL}\n`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
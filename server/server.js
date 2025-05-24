const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables
dotenv.config();
require('dotenv').config();
// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Set static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define routes with error handling
try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('✓ Auth routes loaded');
} catch (error) {
  console.error('✗ Error loading auth routes:', error.message);
}

try {
  app.use('/api/trades', require('./routes/trades'));
  console.log('✓ Trades routes loaded');
} catch (error) {
  console.error('✗ Error loading trades routes:', error.message);
}

try {
  app.use('/api/reflection', require('./routes/reflection'));
  console.log('✓ Reflection routes loaded');
} catch (error) {
  console.error('✗ Error loading reflection routes:', error.message);
}

try {
  app.use('/api/metrics', require('./routes/metrics'));
  console.log('✓ Metrics routes loaded');
} catch (error) {
  console.error('✗ Error loading metrics routes:', error.message);
}

try {
  app.use('/api/analysis', require('./routes/analysis'));
  console.log('✓ Analysis routes loaded');
} catch (error) {
  console.error('✗ Error loading analysis routes:', error.message);
}

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Tradle API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log('Available routes:');
  console.log('- GET  /');
  console.log('- *    /api/auth/*');
  console.log('- *    /api/trades/*');
  console.log('- *    /api/reflection/*');
  console.log('- *    /api/metrics/*');
  console.log('- *    /api/analysis/*');
});

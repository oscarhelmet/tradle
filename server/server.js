const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

console.log(`Loading environment from: ${envFile}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);
console.log(`JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);
console.log(`MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE || '10mb',
  timeout: 60000 // 60 seconds
}));
app.use(express.urlencoded({ extended: true }));

// CORS configuration from environment variables
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment variable
    const corsOrigin = process.env.CORS_ORIGIN;
    
    // If CORS_ORIGIN is '*', allow all origins
    if (corsOrigin === '*') {
      return callback(null, true);
    }
    
    // Parse multiple origins from comma-separated string
    const allowedOrigins = corsOrigin ? corsOrigin.split(',').map(o => o.trim()) : [];
    
    // Add default localhost for development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:5598');
    }
    
    console.log('CORS check:', { origin, allowedOrigins });
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Set static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    corsOrigin: process.env.CORS_ORIGIN
  });
});

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
  console.log(`CORS Origins: ${process.env.CORS_ORIGIN}`);
  console.log('Available routes:');
  console.log('- GET  /');
  console.log('- GET  /api/health');
  console.log('- *    /api/auth/*');
  console.log('- *    /api/trades/*');
  console.log('- *    /api/reflection/*');
  console.log('- *    /api/metrics/*');
  console.log('- *    /api/analysis/*');
});

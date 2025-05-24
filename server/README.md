# Tradle Backend Server

This is the backend server for the Tradle CFD Trading Journal application. It provides API endpoints for user authentication, trade management, AI analysis, and performance metrics.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Google Gemini API for AI analysis (centralized integration - frontend now uses backend API for all Gemini operations)

## Directory Structure

```
server/
├── config/         # Configuration files (database, etc.)
├── middleware/     # Express middleware (auth, file upload, etc.)
├── models/         # MongoDB models
├── routes/         # API routes
├── services/       # Service modules (Gemini API, etc.)
├── uploads/        # Uploaded files (chart images)
├── .env            # Environment variables
├── .env.example    # Example environment variables
├── package.json    # Dependencies and scripts
└── server.js       # Main entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/user` - Get current user

### Trades
- `GET /api/trades` - Get all trades for the current user
- `POST /api/trades` - Create a new trade
- `GET /api/trades/:id` - Get a specific trade
- `PUT /api/trades/:id` - Update a trade
- `DELETE /api/trades/:id` - Delete a trade

### Analysis
- `POST /api/analysis/image` - Analyze a chart image
- `POST /api/analysis/extract` - Extract trade data from an image
- `POST /api/analysis/trade/:id` - Generate insights for a specific trade

### Metrics
- `GET /api/metrics/performance` - Get performance metrics
- `GET /api/metrics/summary` - Get summary statistics

### Reflection
- `GET /api/reflection/trade/:tradeId` - Get AI reflection for a trade
- `POST /api/reflection/trade/:tradeId` - Generate new AI reflection for a trade

## Setup and Installation

1. Install dependencies
```
npm install
```

2. Set up environment variables
```
cp .env.example .env
```
Edit the `.env` file with your MongoDB connection string, JWT secret, and Gemini API key.

3. Start the server
```
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## MongoDB Models

### User
- `id`: Unique identifier
- `email`: User email (unique)
- `password`: Hashed password
- `name`: User's name
- `createdAt`: Account creation date
- `updatedAt`: Account update date

### TradeEntry
- `id`: Unique identifier
- `userId`: Reference to User
- `instrumentType`: Type of instrument (FOREX, STOCK, CRYPTO, etc.)
- `instrumentName`: Name of the instrument (e.g., EUR/USD)
- `direction`: LONG or SHORT
- `entryPrice`: Entry price
- `exitPrice`: Exit price
- `stopLoss`: Stop loss price (optional)
- `takeProfit`: Take profit price (optional)
- `positionSize`: Size of the position
- `profitLoss`: Profit or loss amount
- `profitLossPercentage`: Profit or loss as percentage
- `entryDate`: Date and time of entry
- `exitDate`: Date and time of exit
- `duration`: Trade duration
- `tags`: Array of tags
- `notes`: User notes
- `aiInsights`: AI-generated insights
- `imageUrls`: Array of chart image URLs
- `createdAt`: Record creation date
- `updatedAt`: Record update date

### AIReflection
- `id`: Unique identifier
- `tradeId`: Reference to TradeEntry
- `userId`: Reference to User
- `summary`: Summary of the trade
- `strengths`: Array of strengths
- `weaknesses`: Array of weaknesses
- `suggestions`: Array of suggestions
- `sentiment`: positive, neutral, or negative
- `score`: Rating from 1-10
- `createdAt`: Record creation date
- `updatedAt`: Record update date

## Environment Variables

- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development, production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token generation
- `JWT_EXPIRE`: JWT token expiration (default: 30d)
- `GEMINI_API_KEY`: Google Gemini API key
- `MAX_FILE_SIZE`: Maximum file upload size (default: 10MB)

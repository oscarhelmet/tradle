# Tradle - AI powered CFD Trading Journal

Tradle is a comprehensive CFD trading journal application that helps traders track, analyze, and improve their trading performance. The application uses AI (Google's Gemini) to analyze trade charts, extract trade data, and provide personalized insights.

## Features

- **AI-Powered Trade Analysis**: Upload chart images to automatically extract trade details using Google's Gemini API
- **Trade Journal**: Log and track all your trades with detailed information
- **Performance Analytics**: View comprehensive statistics and trends about your trading performance
- **AI Reflections**: Get AI-generated insights and suggestions to improve your trading
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Glassmorphism cards with animated gradient backgrounds

## Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS with custom glassmorphism and animated gradient effects
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

### AI Integration
- Google Gemini API for image analysis and insights (server-side integration)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google Gemini API key

### Installation

1. Clone the repository
```
git clone https://github.com/oscarhelmet/tradle.git
cd tradle
```

2. Install dependencies for both frontend and backend
```
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

3. Set up environment variables

Create `.env` files in both the root directory and the server directory based on the provided `.env.example` files.

**Important**: The Gemini API key should be set in the server's `.env` file only. The frontend now uses the backend API for all Gemini-related operations.

4. Start MongoDB
```
# If using local MongoDB
mongod
```

5. Run the application
```
# Start the backend server (from the server directory)
npm run dev

# Start the frontend (from the root directory)
npm start
```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Register a new account or log in
2. Navigate to the "New Trade" page
3. Upload a chart image or manually enter trade details
4. View your trade journal, analytics, and AI-generated insights

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## AI Declaration 

This app is vibe coded with Anthropic Claude Sonnet 4 and Google Gemini 2.5 Pro 

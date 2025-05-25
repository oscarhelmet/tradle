#!/bin/bash

echo "🚀 Deploying Tradle Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to prompt for environment variables
setup_env() {
  echo -e "${YELLOW}Setting up environment variables...${NC}"
  
  # Check if .env.production exists for backend
  if [ ! -f "/vol1/tradle/server/.env.production" ]; then
    echo -e "${RED}Backend .env.production not found!${NC}"
    echo "Please create /vol1/tradle/server/.env.production with your production settings"
    echo "Use server/.env.example as a template"
    exit 1
  fi
  
  # Check if .env.production exists for frontend
  if [ ! -f "/vol1/tradle/.env.production" ]; then
    echo -e "${RED}Frontend .env.production not found!${NC}"
    echo "Please create /vol1/tradle/.env.production with your production settings"
    exit 1
  fi
  
  echo -e "${GREEN}Environment files found ✓${NC}"
}

# Create logs directory
mkdir -p /vol1/tradle/logs

# Setup environment
setup_env

# Stop existing processes
echo "Stopping existing processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true

# Build frontend with production environment
echo "Building frontend..."
cd /vol1/tradle
export NODE_ENV=production
npm run build

# Install backend dependencies
echo "Installing backend dependencies..."
cd /vol1/tradle/server
npm install --production

# Start applications
echo "Starting applications..."
cd /vol1/tradle
pm2 start ecosystem.config.js

# Wait a moment for startup
sleep 3

# Test the deployment
echo "Testing deployment..."
backend_health=$(curl -s http://localhost:5599/api/health | grep -o '"success":true' || echo "")
if [ -n "$backend_health" ]; then
  echo -e "${GREEN}Backend health check: ✓${NC}"
else
  echo -e "${RED}Backend health check: ✗${NC}"
fi

# Show status
echo "Application status:"
pm2 status

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "Frontend: http://localhost:5598"
echo "Backend: http://localhost:5599"
echo "Backend Health: http://localhost:5599/api/health"
echo "Logs: pm2 logs"
echo ""
echo -e "${YELLOW}Remember to:${NC}"
echo "1. Replace YOUR_GCP_EXTERNAL_IP with your actual external IP"
echo "2. Configure your firewall to allow ports 5598 and 5599"
echo "3. Update CORS_ORIGIN in server/.env.production with your actual domains"
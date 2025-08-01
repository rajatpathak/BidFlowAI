#!/bin/bash

# BMS Server Deployment Script
set -e

echo "🚀 Starting BMS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required environment variables are set
required_vars=("DATABASE_URL" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}Error: Environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Environment variables validated${NC}"

# Create necessary directories
mkdir -p uploads logs dist

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --production

# Build application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Database setup
echo -e "${YELLOW}Setting up database...${NC}"
npm run db:push

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# Start or restart the application
echo -e "${YELLOW}Starting application with PM2...${NC}"
pm2 start ecosystem.config.js --env production || pm2 restart bms-app

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

echo -e "${GREEN}✅ BMS Deployment completed successfully!${NC}"
echo -e "${GREEN}Application is running on port ${PORT:-5000}${NC}"
echo -e "${GREEN}Health check: http://localhost:${PORT:-5000}/health${NC}"

# Optional: Show PM2 status
pm2 status
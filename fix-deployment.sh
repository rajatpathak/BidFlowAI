#!/bin/bash

# Emergency fix script for VPS deployment
# Run this on your VPS to fix the JSON API response issue

echo "🚨 Emergency fix for BidFlowAI API responses"

# Navigate to project directory
cd /var/www/html/BidFlowAI || {
    echo "❌ Project directory not found"
    exit 1
}

# Stop PM2 process
echo "⏹️ Stopping PM2 process..."
pm2 delete BidFlowAI || echo "Process not running"

# Pull latest changes
echo "📥 Pulling latest code..."
git fetch --all
git reset --hard origin/production

# Clean install
echo "🧹 Clean install..."
rm -rf node_modules package-lock.json dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build project
echo "🏗️ Building project..."
npm run build

# Set environment variables
echo "⚙️ Setting environment..."
export NODE_ENV=production
export PORT=3000

# Start with direct node command to ensure proper API routing
echo "🚀 Starting server with proper API routing..."
pm2 start dist/index.js --name BidFlowAI --env production --log /var/log/bidflowai.log

# Save PM2 configuration
pm2 save

echo "✅ Deployment complete!"
echo "🔍 Testing API endpoint..."

# Wait for server to start
sleep 5

# Test API endpoint
if curl -s -f -H "Content-Type: application/json" http://localhost:3000/api/health > /dev/null; then
    echo "✅ API responding correctly"
else
    echo "❌ API test failed - check logs:"
    pm2 logs BidFlowAI --lines 20
fi

echo "🌐 Server should now be accessible at http://147.93.28.195:8080"
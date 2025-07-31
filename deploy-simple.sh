#!/bin/bash

# Simple deployment script for VPS
echo "🚀 Deploying BidFlowAI with simple production server..."

# Navigate to project directory
cd /var/www/html/BidFlowAI || {
    echo "❌ Project directory not found at /var/www/html/BidFlowAI"
    exit 1
}

# Stop all PM2 processes
echo "⏹️ Stopping all processes..."
pm2 delete all || echo "No processes to stop"

# Kill any lingering node processes
pkill -f node || echo "No node processes to kill"

# Pull latest code
echo "📥 Updating code..."
git fetch --all
git reset --hard origin/production

# Clean install
echo "🧹 Clean installation..."
rm -rf node_modules package-lock.json dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🏗️ Building project..."
npm run build

# Verify build files exist
if [ ! -d "dist/public" ] || [ ! -f "dist/public/index.html" ]; then
    echo "❌ Build failed - dist/public directory or index.html not found"
    echo "Contents of dist:"
    ls -la dist/ || echo "dist directory does not exist"
    exit 1
fi

echo "✅ Build successful - dist/public contains:"
ls -la dist/public/

# Set environment variables
export NODE_ENV=production
export PORT=3000

# Start the simple production server
echo "🚀 Starting simple production server..."
pm2 start server/simple-production.js --name BidFlowAI --env production
pm2 save

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the server
echo "🔍 Testing server..."
if curl -s -f http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server is responding"
    curl -s http://localhost:3000/api/health | jq . || curl -s http://localhost:3000/api/health
else
    echo "❌ Server test failed"
    echo "PM2 status:"
    pm2 status
    echo "PM2 logs:"
    pm2 logs BidFlowAI --lines 10
    exit 1
fi

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Your application should be accessible at:"
echo "   http://147.93.28.195:8080"
echo ""
echo "📊 Test these endpoints:"
echo "   Health: curl http://localhost:3000/api/health"
echo "   Login:  curl -X POST -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin123\"}' http://localhost:3000/api/auth/login"
echo ""
echo "🔧 To check status: pm2 status"
echo "📝 To view logs: pm2 logs BidFlowAI"
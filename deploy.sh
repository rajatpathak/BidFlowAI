#!/bin/bash

# Deployment script for BMS application
echo "🚀 Starting deployment process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the client
echo "🏗️ Building client application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Set environment variables for production
export NODE_ENV=production
export PORT=${PORT:-5000}

echo "✅ Build completed successfully"
echo "📊 Build statistics:"
ls -la dist/

echo "🌐 Server will be available at http://localhost:${PORT}"
echo "🔑 Demo credentials:"
echo "  - Admin: admin/admin123"
echo "  - Bidder: rahul.kumar/bidder123" 
echo "  - Finance: priya.sharma/finance123"

# Start the server
echo "🚀 Starting production server..."
node dist/index.js
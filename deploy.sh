#!/bin/bash

# Production Deployment Script for Replit
# Fixes deployment error: "Run command contains 'dev' which is blocked for security reasons"

set -e

echo "🚀 BMS Production Deployment Starting..."

# Set production environment
export NODE_ENV=production
export PORT=${PORT:-5000}

echo "📍 Environment: $NODE_ENV"
echo "🔌 Port: $PORT"

# Build the application
echo "📦 Building application for production..."
npm run build

# Push database schema if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
    echo "🗄️  Updating database schema..."
    npm run db:push
else
    echo "ℹ️  No DATABASE_URL found, using in-memory storage"
fi

# Start production server
echo "🎯 Starting production server..."
echo "🌐 Server will be available at http://localhost:$PORT"

# Start the server with production environment
NODE_ENV=production node dist/index.js
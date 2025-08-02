#!/bin/bash
# Production deployment script for BMS on server
set -e

echo "🚀 BMS Production Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Environment setup
export NODE_ENV=production
export PORT=${PORT:-5000}

echo "📦 Installing dependencies..."
npm ci --production

echo "🔧 Installing TypeScript dependencies for build..."
npm install --no-save tsx esbuild drizzle-kit typescript

echo "🏗️ Building application..."
npm run build

echo "🗄️ Setting up database..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️ WARNING: DATABASE_URL not set. Please configure your database connection."
    echo "Example: export DATABASE_URL='postgresql://user:password@localhost/bms_production'"
else
    echo "✅ Database URL configured"
    echo "📊 Pushing database schema..."
    npm run db:push
    
    echo "🌱 Seeding database with initial data..."
    npm run db:seed
fi

echo "🔒 Setting production environment..."
echo "NODE_ENV=production" > .env.production
echo "PORT=${PORT}" >> .env.production

echo "🎯 Production build complete!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "Server will run on port ${PORT}"
echo "Make sure to set these environment variables:"
echo "  - DATABASE_URL (PostgreSQL connection string)"
echo "  - NODE_ENV=production"
echo "  - PORT=${PORT}"
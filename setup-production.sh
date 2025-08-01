#!/bin/bash

# Production setup script for BMS deployment
set -e

echo "🚀 Setting up BMS for production deployment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Set production environment
export NODE_ENV=production

# Check if build directory exists
if [ ! -d "dist" ]; then
    print_status "Building application for production..."
    npm run build
else
    print_warning "Build directory exists, skipping build step"
fi

# Verify build completed successfully
if [ ! -f "dist/index.js" ]; then
    print_error "Build failed - dist/index.js not found"
    exit 1
fi

print_status "Production build completed successfully"

# Check database connection
if [ -n "$DATABASE_URL" ]; then
    print_status "Database URL configured"
    
    # Push database schema if needed
    echo "Pushing database schema..."
    npm run db:push
else
    print_warning "DATABASE_URL not set - using in-memory storage"
fi

# Set production port
export PORT=${PORT:-5000}

print_status "Production setup complete!"
echo
echo "🎯 Ready for deployment with the following configuration:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   Database: ${DATABASE_URL:+Configured}"
echo
echo "To start the production server:"
echo "   node dist/index.js"
echo
echo "Or use the production startup script:"
echo "   node start-production.js"
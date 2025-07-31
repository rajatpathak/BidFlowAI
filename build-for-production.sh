#!/bin/bash

# Build script for production deployment
set -e

echo "🚀 Starting production build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.vite/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build the client (outputs to dist/public due to vite.config.ts)
echo "🏗️ Building client application..."
npm run build

# The vite build outputs to dist/public, but we need to adjust server references
# Create the directory structure that server expects
echo "📁 Adjusting build structure..."
if [ -d "dist/public" ]; then
  echo "✅ Client built to dist/public (as expected)"
else
  echo "❌ Build failed - dist/public not found"
  exit 1
fi

# Build info
echo "📊 Build completed successfully"
echo "📁 Directory structure:"
find dist -type f -name "*.html" -o -name "*.js" | head -10

echo "✅ Production build complete!"
echo "🌐 Ready for deployment with:"
echo "  - Frontend: dist/public/"
echo "  - Backend: dist/index.js"
echo "  - PM2 config: pm2.config.js"
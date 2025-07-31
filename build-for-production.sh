#!/bin/bash

echo "🚀 Building project for production..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build frontend with Vite
echo "📦 Building frontend..."
npm run build 2>/dev/null || {
    echo "❌ Frontend build failed"
    exit 1
}

# Fix build structure (move files from dist/public to dist)
echo "🔧 Fixing build structure..."
node fix-build.js

# Build backend with esbuild
echo "🔧 Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Production build complete!"
echo "📁 Files are ready in /dist directory"
echo "🚀 Run: NODE_ENV=production node dist/index.js"
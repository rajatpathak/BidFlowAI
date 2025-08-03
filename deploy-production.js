#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 BMS Production Deployment Script');
console.log('=====================================');

try {
  // Step 1: Build the application
  console.log('📦 Building application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 2: Copy built files to server/public for static serving
  console.log('📁 Copying built files to server/public...');
  const sourceDir = path.join(__dirname, 'dist', 'public');
  const targetDir = path.join(__dirname, 'server', 'public');

  // Remove existing server/public directory
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // Copy dist/public to server/public
  function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      const files = fs.readdirSync(src);
      files.forEach(file => {
        copyRecursive(path.join(src, file), path.join(dest, file));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  copyRecursive(sourceDir, targetDir);

  // Step 3: Start the production server
  console.log('🌟 Starting production server...');
  console.log('Server will be available at http://localhost:5000');
  
  process.env.NODE_ENV = 'production';
  process.env.PORT = process.env.PORT || '5000';
  
  execSync('node dist/index.js', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
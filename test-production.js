#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Production Build');

// Build the application
console.log('📦 Building...');
execSync('npm run build', { stdio: 'inherit' });

// Copy files to server/public
const sourceDir = path.join(__dirname, 'dist', 'public');
const targetDir = path.join(__dirname, 'server', 'public');

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

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

console.log('✅ Files copied to server/public');
console.log('📋 Contents:');
console.log(fs.readdirSync(targetDir));

// Test production mode with specific environment
process.env.NODE_ENV = 'production';
process.env.PORT = '5001';

console.log('🌟 Starting production server on port 5001...');
execSync('node dist/index.js', { stdio: 'inherit' });
#!/usr/bin/env node
// Bootstrap script to install dependencies and start the server
import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 Starting BMS Application Bootstrap...');

// Check if node_modules exists
if (!existsSync('./node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    // Install all dependencies including devDependencies
    execSync('npm ci', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ CI install failed, trying regular install...');
    try {
      execSync('npm install', { stdio: 'inherit' });
    } catch (installError) {
      console.error('❌ Failed to install dependencies:', installError.message);
      process.exit(1);
    }
  }
} else {
  // Check if dev dependencies are installed
  if (!existsSync('./node_modules/vite')) {
    console.log('📦 Installing missing dev dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
    } catch (installError) {
      console.error('❌ Failed to install dev dependencies:', installError.message);
      process.exit(1);
    }
  }
}

console.log('✅ Dependencies ready');

// Start the server using node directly with tsx
console.log('🌟 Starting server...');
try {
  execSync('npx tsx server/index.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}
#!/usr/bin/env node

/**
 * Production Deployment Script for Replit
 * 
 * This script ensures the application is built and ready for production
 * deployment without using any 'dev' commands.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const ENV = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || '5000',
  ...process.env
};

console.log('🚀 BMS Production Deployment Starting...');
console.log(`📍 Environment: ${ENV.NODE_ENV}`);
console.log(`🔌 Port: ${ENV.PORT}`);

// Check if build exists, if not build it
const buildExists = existsSync(join(process.cwd(), 'dist', 'index.js'));

if (!buildExists) {
  console.log('⚠️  No production build found, building now...');
  
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    env: ENV
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build completed successfully');
      startProductionServer();
    } else {
      console.error('❌ Build failed with code:', code);
      process.exit(1);
    }
  });
} else {
  console.log('✅ Production build found');
  startProductionServer();
}

function startProductionServer() {
  console.log('🎯 Starting production server...');
  
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: ENV
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code: ${code}`);
    process.exit(code);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM, shutting down gracefully');
    serverProcess.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
  });
  
  process.on('SIGINT', () => {
    console.log('📴 Received SIGINT, shutting down gracefully');
    serverProcess.kill('SIGINT');
    setTimeout(() => process.exit(0), 1000);
  });
}
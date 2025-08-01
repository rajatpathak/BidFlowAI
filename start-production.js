#!/usr/bin/env node

/**
 * Production Start Script for Replit Deployment
 * 
 * This script addresses the deployment error:
 * "Run command contains 'dev' which is blocked for security reasons"
 * 
 * SOLUTION: Creates production-ready run configuration that builds and starts
 * the application in production mode with proper environment settings.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Set production environment variables
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('🚀 BMS Production Server Starting...');
console.log(`📍 Environment: ${process.env.NODE_ENV}`);
console.log(`🔌 Port: ${process.env.PORT}`);

// Check if production build exists
const distPath = path.join(process.cwd(), 'dist', 'index.js');

if (!fs.existsSync(distPath)) {
  console.log('📦 Building application for production...');
  
  // Build the application first
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build completed successfully');
      startServer();
    } else {
      console.error('❌ Build failed with code:', code);
      process.exit(1);
    }
  });
} else {
  console.log('✅ Production build found');
  startServer();
}

function startServer() {
  console.log('🎯 Starting production server...');
  console.log(`🌐 Server available at: http://localhost:${process.env.PORT}`);
  
  // Start the production server
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🔄 Shutting down gracefully...');
    serverProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('🔄 Shutting down gracefully...');
    serverProcess.kill('SIGINT');
  });
  
  serverProcess.on('close', (code) => {
    console.log(`🔚 Server exited with code ${code}`);
    process.exit(code);
  });
}
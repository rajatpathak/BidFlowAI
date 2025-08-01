#!/usr/bin/env node

/**
 * Simple Production Starter for Replit Deployment
 * 
 * Use this script when deploying to avoid the 'dev' command restriction
 * Command: node start-production.js
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

const distPath = path.resolve('dist/index.js');

async function startProduction() {
  console.log('🚀 Starting BMS in Production Mode...');
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Port: ${process.env.PORT}`);
  
  // Check if build exists
  if (!fs.existsSync(distPath)) {
    console.log('❌ Production build not found. Please run: npm run build');
    console.log('Building now...');
    
    const buildProcess = spawn('npm', ['run', 'build'], { 
      stdio: 'inherit',
      env: process.env
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed. Starting server...');
        startServer();
      } else {
        console.error('❌ Build failed');
        process.exit(1);
      }
    });
  } else {
    console.log('✅ Production build found. Starting server...');
    startServer();
  }
}

function startServer() {
  console.log(`🌐 Server starting at http://localhost:${process.env.PORT}`);
  console.log(`🏥 Health check: http://localhost:${process.env.PORT}/api/health`);
  
  const serverProcess = spawn('node', [distPath], {
    stdio: 'inherit',
    env: process.env
  });
  
  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('🔄 Graceful shutdown...');
    serverProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('🔄 Graceful shutdown...');
    serverProcess.kill('SIGINT');
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
}

startProduction();
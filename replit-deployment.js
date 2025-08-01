#!/usr/bin/env node

/**
 * Replit Production Deployment Handler
 * This script addresses the "dev command blocked" security issue
 * by providing a production-ready alternative entry point
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Production environment configuration
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('🚀 BMS Production Deployment Starting...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);

async function ensureProductionSetup() {
  // Create required directories
  const dirs = ['dist', 'logs', 'uploads'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
}

async function buildForProduction() {
  console.log('🔨 Building application for production...');
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully');
        resolve();
      } else {
        console.error('❌ Build failed');
        reject(new Error(`Build process exited with code ${code}`));
      }
    });
  });
}

async function startProductionServer() {
  console.log('🌟 Starting production server...');
  
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', ['dist/index.js'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully');
      serverProcess.kill('SIGTERM');
    });
    
    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully');
      serverProcess.kill('SIGINT');
    });
    
    serverProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Server process exited with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    await ensureProductionSetup();
    await buildForProduction();
    await startProductionServer();
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main();
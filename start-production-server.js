#!/usr/bin/env node

/**
 * Production Server Starter for BMS
 * Ensures proper routing on port 5000
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function startProductionServer() {
  console.log('🚀 Starting BMS Production Server on Port 5000...');
  
  try {
    // Ensure build exists
    if (!fs.existsSync('dist/index.js')) {
      console.log('📦 Building application...');
      await execAsync('npm run build');
      console.log('✅ Build complete');
    }
    
    // Ensure static files exist
    if (!fs.existsSync('server/public/index.html')) {
      console.log('❌ No static files found. Run npm run build first.');
      process.exit(1);
    }
    
    // Set production environment
    process.env.NODE_ENV = 'production';
    process.env.PORT = '5000';
    
    console.log('🌐 Environment: production');
    console.log('🔌 Port: 5000');
    console.log('📁 Static files: server/public/');
    
    // Start the production server
    const { default: app } = await import('./dist/index.js');
    
    console.log('✅ Production server started successfully');
    console.log('🔗 Access at: http://localhost:5000');
    console.log('🔗 Health check: http://localhost:5000/api/health');
    
  } catch (error) {
    console.error('❌ Failed to start production server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down production server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down production server...');
  process.exit(0);
});

startProductionServer();
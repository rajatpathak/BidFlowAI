#!/usr/bin/env node

/**
 * Replit Production Deployment Script
 * 
 * This script addresses the deployment error:
 * "Run command contains 'dev' which is blocked for security reasons"
 * 
 * It ensures the application runs in production mode with proper build process.
 */

import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function deployProduction() {
  console.log('🚀 Starting BMS Production Deployment...');
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔌 Port: ${process.env.PORT}`);
  
  try {
    // Step 1: Check if build exists, if not build first
    const distPath = path.join(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.js');
    
    if (!fs.existsSync(indexPath)) {
      console.log('📦 Building application for production...');
      await runCommand('npm', ['run', 'build']);
      console.log('✅ Build completed successfully');
    } else {
      console.log('✅ Production build already exists');
    }
    
    // Step 2: Push database schema if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      console.log('🗄️  Pushing database schema...');
      try {
        await runCommand('npm', ['run', 'db:push']);
        console.log('✅ Database schema updated');
      } catch (error) {
        console.log('⚠️  Database schema push failed (continuing anyway):', error.message);
      }
    } else {
      console.log('ℹ️  No DATABASE_URL set, using in-memory storage');
    }
    
    // Step 3: Start production server
    console.log('🎯 Starting production server...');
    console.log(`🌐 Server will be available at http://localhost:${process.env.PORT}`);
    console.log(`🏥 Health check: http://localhost:${process.env.PORT}/health`);
    
    // Start the production server (this will run indefinitely)
    const serverProcess = spawn('node', [indexPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 Received SIGTERM, shutting down gracefully...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('🔄 Received SIGINT, shutting down gracefully...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`🔚 Production server exited with code ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployProduction();
#!/usr/bin/env node

/**
 * Production Startup Script for Replit Deployment
 * 
 * This script serves as a production-ready entry point that:
 * - Builds the application if needed
 * - Sets up production environment
 * - Starts the server in production mode
 * 
 * Command: node start-production.js
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

console.log('🚀 Starting Business Management System...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true
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

async function startProduction() {
  try {
    // Check if build exists
    const distPath = path.join(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.js');
    
    if (!fs.existsSync(indexPath)) {
      console.log('Building application for production...');
      await runCommand('npm', ['run', 'build']);
      console.log('Build completed successfully');
    }
    
    // Push database schema if needed
    if (process.env.DATABASE_URL) {
      console.log('Updating database schema...');
      try {
        await runCommand('npm', ['run', 'db:push']);
        console.log('Database schema updated');
      } catch (error) {
        console.log('Database schema update failed (continuing):', error.message);
      }
    }
    
    // Start production server
    console.log('Starting production server...');
    console.log(`Server available at: http://localhost:${process.env.PORT}`);
    
    const serverProcess = spawn('node', [indexPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Handle graceful shutdown
    ['SIGTERM', 'SIGINT'].forEach(signal => {
      process.on(signal, () => {
        console.log(`Received ${signal}, shutting down gracefully...`);
        serverProcess.kill(signal);
        process.exit(0);
      });
    });
    
    serverProcess.on('close', (code) => {
      console.log(`Server exited with code ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

startProduction();
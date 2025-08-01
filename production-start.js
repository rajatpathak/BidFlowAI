#!/usr/bin/env node

/**
 * Production Startup Script - Clean deployment entry point
 * Command: node production-start.js
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('Starting Business Management System');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);

async function build() {
  const distPath = path.join(__dirname, 'dist', 'index.js');
  
  if (!fs.existsSync(distPath)) {
    console.log('Building application...');
    
    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'inherit',
        shell: true
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Build completed');
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  }
}

async function startServer() {
  const serverPath = path.join(__dirname, 'dist', 'index.js');
  
  console.log('Starting production server...');
  
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    server.kill('SIGINT');
    process.exit(0);
  });
  
  server.on('close', (code) => {
    process.exit(code);
  });
}

async function main() {
  try {
    await build();
    await startServer();
  } catch (error) {
    console.error('Failed to start:', error.message);
    process.exit(1);
  }
}

main();
#!/usr/bin/env node

/**
 * Simple Production Entry Point for Replit Deployment
 * This is a clean, minimal production server that builds and starts the application
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

console.log('🚀 BMS Production Deployment Starting...');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

// Ensure required directories exist
const dirs = ['dist', 'logs', 'uploads'];
dirs.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Build and start the application
async function deployProduction() {
  try {
    console.log('📦 Building application...');
    
    // Build the application
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully');
        
        // Start production server
        console.log('🌟 Starting production server...');
        const serverProcess = spawn('npm', ['start'], {
          stdio: 'inherit',
          shell: true,
          env: process.env
        });

        serverProcess.on('error', (error) => {
          console.error('❌ Failed to start server:', error);
          process.exit(1);
        });

      } else {
        console.error('❌ Build failed with code:', code);
        process.exit(1);
      }
    });

    buildProcess.on('error', (error) => {
      console.error('❌ Build process failed:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

deployProduction();
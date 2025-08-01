#!/usr/bin/env node

/**
 * Production Server Starter
 * This script handles the complete production deployment process
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Production configuration
const PRODUCTION_CONFIG = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || 5000,
  // Inherit all environment variables for database, secrets, etc.
  ...process.env
};

function logWithTimestamp(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    logWithTimestamp(`Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...PRODUCTION_CONFIG, ...options.env },
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

async function ensureDirectories() {
  const dirs = ['dist', 'logs', 'uploads'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logWithTimestamp(`Created directory: ${dir}`);
    }
  });
}

async function buildApplication() {
  logWithTimestamp('Building application for production...');
  
  try {
    // Build frontend and backend
    await runCommand('npm', ['run', 'build']);
    logWithTimestamp('Build completed successfully');
  } catch (error) {
    logWithTimestamp(`Build failed: ${error.message}`, 'error');
    throw error;
  }
}

async function startProductionServer() {
  logWithTimestamp('Starting production server...');
  
  try {
    // Start the built application
    await runCommand('npm', ['start']);
  } catch (error) {
    logWithTimestamp(`Server failed to start: ${error.message}`, 'error');
    throw error;
  }
}

async function main() {
  try {
    logWithTimestamp('🚀 Starting BMS Production Deployment');
    
    // Step 1: Ensure required directories exist
    await ensureDirectories();
    
    // Step 2: Build the application
    await buildApplication();
    
    // Step 3: Start production server
    await startProductionServer();
    
  } catch (error) {
    logWithTimestamp(`Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logWithTimestamp('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logWithTimestamp('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { main };
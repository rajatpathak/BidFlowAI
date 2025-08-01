#!/usr/bin/env node

/**
 * Replit Deployment Script - Optimized for Replit's deployment system
 * This handles the complete production deployment with health checks
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

// Production configuration
const CONFIG = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || 5000,
  HOST: '0.0.0.0'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkHealth(port = CONFIG.PORT) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      if (res.statusCode === 200) {
        log('Health check passed - Server is running correctly');
        resolve(true);
      } else {
        log(`Health check failed - Status: ${res.statusCode}`, 'warn');
        resolve(false);
      }
    });

    req.on('error', () => {
      log('Health check failed - Server not responding', 'warn');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      log('Health check timeout', 'warn');
      resolve(false);
    });
  });
}

async function ensureDirectories() {
  const dirs = ['dist', 'logs', 'uploads', 'uploads/documents', 'uploads/images'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`);
    }
  });
}

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...CONFIG }
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

async function buildApplication() {
  log('Building application for production...');
  try {
    await runCommand('npm', ['run', 'build']);
    log('Build completed successfully');
    
    // Verify build output
    if (fs.existsSync('dist/index.js')) {
      const stats = fs.statSync('dist/index.js');
      log(`Server bundle created: ${Math.round(stats.size / 1024)}KB`);
    }
    
    if (fs.existsSync('dist/public')) {
      log('Frontend assets built successfully');
    }
    
  } catch (error) {
    log(`Build failed: ${error.message}`, 'error');
    throw error;
  }
}

async function startServer() {
  log('Starting production server...');
  
  // Start the server in the background
  const serverProcess = spawn('npm', ['start'], {
    stdio: 'inherit',
    env: { ...process.env, ...CONFIG },
    detached: false
  });

  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check if server started successfully
  const healthCheck = await checkHealth();
  if (healthCheck) {
    log(`🎉 BMS deployed successfully at http://0.0.0.0:${CONFIG.PORT}`);
    log(`Health endpoint: http://0.0.0.0:${CONFIG.PORT}/api/health`);
  } else {
    log('Server started but health check failed', 'warn');
  }

  return serverProcess;
}

async function main() {
  try {
    log('🚀 Starting BMS Production Deployment');
    log(`Environment: ${CONFIG.NODE_ENV}`);
    log(`Port: ${CONFIG.PORT}`);
    
    // Setup
    await ensureDirectories();
    
    // Build
    await buildApplication();
    
    // Deploy
    const serverProcess = await startServer();
    
    // Keep the process running
    process.on('SIGTERM', () => {
      log('Received SIGTERM, shutting down...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      log('Received SIGINT, shutting down...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Start deployment if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
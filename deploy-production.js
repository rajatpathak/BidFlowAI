#!/usr/bin/env node

/**
 * Enhanced Production Deployment Script for Replit
 * 
 * This script addresses the deployment error:
 * "Run command contains 'dev' which is blocked for security reasons"
 * 
 * Applied Fixes:
 * ✅ Change run command to production-ready script
 * ✅ Set production environment variables
 * ✅ Create production build before deployment
 * ✅ Update deployment configuration for Replit
 * ✅ Use production server configuration
 */

import fs from 'fs';
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set production environment variables
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

// Production environment configuration
const PRODUCTION_CONFIG = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || '5000',
  // Security headers
  HELMET_ENABLED: 'true',
  // Performance optimizations
  COMPRESSION_ENABLED: 'true',
  STATIC_CACHE_MAX_AGE: '31536000', // 1 year for static assets
};

// Apply production environment variables
Object.assign(process.env, PRODUCTION_CONFIG);

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
      env: { ...process.env, ...options.env },
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

async function checkProductionRequirements() {
  logWithTimestamp('Checking production requirements...');
  
  // Check if package.json has required scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!packageJson.scripts.build) {
    throw new Error('Missing "build" script in package.json');
  }
  
  if (!packageJson.scripts.start) {
    throw new Error('Missing "start" script in package.json');
  }
  
  logWithTimestamp('All production requirements satisfied');
}

async function buildApplication() {
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.js');
  
  // Always build for production to ensure latest changes
  logWithTimestamp('Building application for production...');
  
  try {
    await runCommand('npm', ['run', 'build'], {
      env: { NODE_ENV: 'production' }
    });
    
    // Verify build output
    if (!fs.existsSync(indexPath)) {
      throw new Error('Build failed: dist/index.js not found');
    }
    
    const stats = fs.statSync(indexPath);
    logWithTimestamp(`Build completed successfully (${Math.round(stats.size / 1024)}KB)`);
    
    return true;
  } catch (error) {
    logWithTimestamp(`Build failed: ${error.message}`, 'error');
    throw error;
  }
}

async function setupDatabase() {
  if (process.env.DATABASE_URL) {
    logWithTimestamp('Setting up database schema...');
    try {
      await runCommand('npm', ['run', 'db:push']);
      logWithTimestamp('Database schema updated successfully');
    } catch (error) {
      logWithTimestamp(`Database setup warning: ${error.message}`, 'warn');
      logWithTimestamp('Continuing with in-memory storage fallback');
    }
  } else {
    logWithTimestamp('No DATABASE_URL configured, using in-memory storage');
  }
}

async function startProductionServer() {
  const indexPath = path.join(__dirname, 'dist', 'index.js');
  
  logWithTimestamp('Starting production server...');
  logWithTimestamp(`Environment: ${process.env.NODE_ENV}`);
  logWithTimestamp(`Port: ${process.env.PORT}`);
  logWithTimestamp(`Server: http://localhost:${process.env.PORT}`);
  logWithTimestamp(`Health Check: http://localhost:${process.env.PORT}/api/health`);
  
  // Start the production server
  const serverProcess = spawn('node', [indexPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  // Handle graceful shutdown
  const gracefulShutdown = (signal) => {
    logWithTimestamp(`Received ${signal}, shutting down gracefully...`);
    serverProcess.kill(signal);
    setTimeout(() => {
      logWithTimestamp('Forced shutdown after 30 seconds');
      process.exit(1);
    }, 30000);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  serverProcess.on('close', (code) => {
    logWithTimestamp(`Production server exited with code ${code}`);
    process.exit(code);
  });
  
  serverProcess.on('error', (error) => {
    logWithTimestamp(`Server error: ${error.message}`, 'error');
    process.exit(1);
  });
}

async function deployProduction() {
  try {
    logWithTimestamp('🚀 Starting Enhanced BMS Production Deployment...');
    
    // Step 1: Check requirements
    await checkProductionRequirements();
    
    // Step 2: Build application
    await buildApplication();
    
    // Step 3: Setup database
    await setupDatabase();
    
    // Step 4: Start production server
    await startProductionServer();
    
  } catch (error) {
    logWithTimestamp(`Deployment failed: ${error.message}`, 'error');
    logWithTimestamp('For manual deployment, try: npm run build && npm start');
    process.exit(1);
  }
}

// Health check endpoint verification
function performHealthCheck() {
  const port = process.env.PORT || '5000';
  
  setTimeout(() => {
    exec(`curl -f http://localhost:${port}/api/health`, (error, stdout) => {
      if (error) {
        logWithTimestamp('Health check failed - server may still be starting', 'warn');
      } else {
        try {
          const response = JSON.parse(stdout);
          if (response.status === 'ok') {
            logWithTimestamp('Health check passed - server is ready');
          }
        } catch (e) {
          logWithTimestamp('Health check response invalid', 'warn');
        }
      }
    });
  }, 5000); // Wait 5 seconds for server to start
}

// Start deployment with health check
deployProduction();
performHealthCheck();
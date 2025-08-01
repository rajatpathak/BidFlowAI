#!/usr/bin/env node

/**
 * Replit Deployment Script - CommonJS version for compatibility
 * This handles the complete production deployment with health checks
 */

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

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
        log('Health check passed - Server running correctly');
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
  const dirs = ['dist', 'logs', 'uploads'];
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
      log(`Server bundle: ${Math.round(stats.size / 1024)}KB`);
    }
    
  } catch (error) {
    log(`Build failed: ${error.message}`, 'error');
    throw error;
  }
}

async function startServer() {
  log('Starting production server...');
  
  const serverProcess = spawn('npm', ['start'], {
    stdio: 'inherit',
    env: { ...process.env, ...CONFIG }
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Health check
  const healthCheck = await checkHealth();
  if (healthCheck) {
    log(`🎉 BMS deployed successfully!`);
    log(`URL: http://0.0.0.0:${CONFIG.PORT}`);
    log(`Health: http://0.0.0.0:${CONFIG.PORT}/api/health`);
  }

  return serverProcess;
}

async function main() {
  try {
    log('🚀 BMS Production Deployment Starting');
    log(`Environment: ${CONFIG.NODE_ENV}, Port: ${CONFIG.PORT}`);
    
    await ensureDirectories();
    await buildApplication();
    const serverProcess = await startServer();
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      log('Shutting down gracefully...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      log('Shutting down gracefully...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
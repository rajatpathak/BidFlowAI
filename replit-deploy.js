#!/usr/bin/env node

/**
 * Replit Production Deployment Script
 * 
 * Comprehensive production deployment solution that:
 * - Sets NODE_ENV=production 
 * - Auto-builds if needed
 * - Binds to 0.0.0.0 for external access
 * - Handles graceful shutdown
 * - Provides health checks
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

// Production environment configuration
const ENV = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || '5000',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'production-default-secret-change-me',
  ...process.env
};

console.log('🚀 BMS Production Deployment Starting...');
console.log(`📍 Environment: ${ENV.NODE_ENV}`);
console.log(`🔌 Port: ${ENV.PORT}`);
console.log(`🗄️  Database: ${ENV.DATABASE_URL ? 'Connected' : 'Not configured'}`);

// Create required directories
const requiredDirs = ['dist', 'uploads'];
requiredDirs.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Check if build exists and is recent
const distPath = join(process.cwd(), 'dist', 'index.js');
const buildExists = existsSync(distPath);
let shouldBuild = !buildExists;

if (buildExists) {
  // Check if source files are newer than build
  const buildTime = new Date(statSync(distPath).mtime);
  const sourceFiles = ['server/index.ts', 'package.json', 'vite.config.ts'];
  
  for (const file of sourceFiles) {
    if (existsSync(file)) {
      const sourceTime = new Date(statSync(file).mtime);
      if (sourceTime > buildTime) {
        shouldBuild = true;
        console.log(`📝 Source file ${file} is newer than build, rebuilding...`);
        break;
      }
    }
  }
}

if (shouldBuild) {
  console.log('🔨 Building production bundle...');
  
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    env: ENV,
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build completed successfully');
      startProductionServer();
    } else {
      console.error('❌ Build failed with exit code:', code);
      console.error('💡 Try running: npm run build');
      process.exit(1);
    }
  });
  
  buildProcess.on('error', (error) => {
    console.error('❌ Build process error:', error.message);
    process.exit(1);
  });
} else {
  console.log('✅ Production build is up to date');
  startProductionServer();
}

function startProductionServer() {
  console.log('🎯 Starting production server...');
  console.log(`🌐 Server will bind to 0.0.0.0:${ENV.PORT}`);
  console.log(`🔗 Health check: http://localhost:${ENV.PORT}/api/health`);
  
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: ENV,
    shell: true
  });
  
  serverProcess.on('close', (code) => {
    console.log(`📴 Server process exited with code: ${code}`);
    process.exit(code || 0);
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Server process error:', error.message);
    process.exit(1);
  });
  
  // Graceful shutdown handlers
  const shutdown = (signal) => {
    console.log(`📴 Received ${signal}, shutting down gracefully...`);
    serverProcess.kill(signal);
    setTimeout(() => {
      console.log('⏰ Forced shutdown after timeout');
      process.exit(0);
    }, 5000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception:', error);
    shutdown('SIGTERM');
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled rejection:', reason);
    shutdown('SIGTERM');
  });
}
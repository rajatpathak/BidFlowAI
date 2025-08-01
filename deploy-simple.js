#!/usr/bin/env node

/**
 * Simple Production Deployment Script (Alternative)
 * Uses existing npm scripts for maximum compatibility
 */

import { spawn } from 'child_process';

console.log('🚀 Simple Production Deployment...');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('🔨 Building application...');

// Build first
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build successful, starting server...');
    
    // Start production server
    const startProcess = spawn('npm', ['start'], {
      stdio: 'inherit',
      env: process.env,
      shell: true
    });
    
    startProcess.on('close', (exitCode) => {
      process.exit(exitCode || 0);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => startProcess.kill('SIGTERM'));
    process.on('SIGINT', () => startProcess.kill('SIGINT'));
    
  } else {
    console.error('❌ Build failed');
    process.exit(1);
  }
});

buildProcess.on('error', (error) => {
  console.error('Build error:', error);
  process.exit(1);
});
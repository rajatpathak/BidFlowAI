#!/usr/bin/env node

// Production startup script for deployment
process.env.NODE_ENV = 'production';

// Check if build exists, if not build first
import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');

async function startProduction() {
  console.log('🚀 Starting production server...');
  
  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    console.log('📦 Building application for production...');
    
    // Run build command
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true
    });
    
    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build completed successfully');
          resolve();
        } else {
          console.error('❌ Build failed with code:', code);
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  }
  
  // Start the production server
  console.log('🎯 Starting production server...');
  const serverProcess = spawn('node', [path.join(distPath, 'index.js')], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Production server exited with code ${code}`);
  });
}

startProduction().catch(console.error);
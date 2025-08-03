#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting BMS in Production Mode');

// Ensure production build exists
const sourceDir = path.join(__dirname, 'dist', 'public');
const targetDir = path.join(__dirname, 'server', 'public');

if (!fs.existsSync(sourceDir)) {
  console.error('❌ No production build found. Run npm run build first.');
  process.exit(1);
}

// Copy files to server/public
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
copyRecursive(sourceDir, targetDir);

console.log('✅ Static files copied to server/public');

// Start production server with environment variables
const serverProcess = spawn('node', ['dist/index.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000'
  },
  stdio: 'inherit'
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  serverProcess.kill('SIGTERM');
});
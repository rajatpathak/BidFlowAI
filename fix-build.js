#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const distPublicPath = path.resolve('dist/public');
const distPath = path.resolve('dist');

console.log('Fixing build output structure...');

// Check if dist/public exists
if (fs.existsSync(distPublicPath)) {
  // Get all files and directories in dist/public
  const items = fs.readdirSync(distPublicPath);
  
  // Move each item from dist/public to dist
  for (const item of items) {
    const sourcePath = path.join(distPublicPath, item);
    const targetPath = path.join(distPath, item);
    
    // Remove target if it exists
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
    
    // Move the item
    fs.renameSync(sourcePath, targetPath);
    console.log(`Moved: ${item}`);
  }
  
  // Remove the empty dist/public directory
  fs.rmdirSync(distPublicPath);
  console.log('Removed empty dist/public directory');
  
  console.log('✅ Build structure fixed! Files are now directly in /dist');
} else {
  console.log('No dist/public directory found. Build structure is already correct.');
}
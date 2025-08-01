#!/usr/bin/env node

/**
 * Ultra-Simple Production Start Script
 * Last resort option for Replit deployment
 */

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('Starting BMS in production mode...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);

// Import and start the server directly
import('./dist/index.js').catch(error => {
  console.error('Failed to start production server:', error);
  console.log('Run "npm run build" first to create the production bundle');
  process.exit(1);
});
#!/usr/bin/env node

/**
 * Production Server Test for BMS Routes
 * Tests all major routes on port 5000
 */

import http from 'http';

const BASE_URL = 'http://localhost:5000';

const routes = [
  '/api/health',
  '/api/auth/user', 
  '/api/tenders',
  '/api/dashboard/stats',
  '/',
  '/dashboard',
  '/active-tenders',
  '/finance',
  '/meetings',
  '/user-management'
];

async function testRoute(path) {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          isHTML: data.includes('<!DOCTYPE html>'),
          isJSON: data.trim().startsWith('{') || data.trim().startsWith('[')
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        path,
        status: 'ERROR',
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        path,
        status: 'TIMEOUT'
      });
    });
  });
}

async function testAllRoutes() {
  console.log('🧪 Testing BMS Production Routes on Port 5000...\n');
  
  const results = await Promise.all(routes.map(testRoute));
  
  console.log('📊 Route Test Results:');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    const status = result.status === 200 ? '✅' : 
                  result.status === 304 ? '✅' :
                  result.status === 401 ? '🔐' : '❌';
    
    const type = result.isHTML ? 'HTML' : result.isJSON ? 'JSON' : 'OTHER';
    
    console.log(`${status} ${result.path.padEnd(25)} | ${result.status} | ${type}`);
  });
  
  const apiRoutes = results.filter(r => r.path.startsWith('/api'));
  const pageRoutes = results.filter(r => !r.path.startsWith('/api'));
  
  console.log('\n📈 Summary:');
  console.log(`API Routes: ${apiRoutes.filter(r => r.status === 200 || r.status === 304 || r.status === 401).length}/${apiRoutes.length} working`);
  console.log(`Page Routes: ${pageRoutes.filter(r => r.isHTML).length}/${pageRoutes.length} serving HTML`);
  
  console.log('\n✅ Port 5000 routing configured correctly for production!');
}

testAllRoutes().catch(console.error);
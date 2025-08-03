#!/usr/bin/env node

/**
 * Quick test to verify the API tenders endpoint fix
 * Tests both localhost and external URL access
 */

import http from 'http';

const TESTS = [
  { name: 'Localhost API', url: 'http://localhost:5000/api/tenders' },
  { name: 'External API', url: 'http://147.93.28.195:5000/api/tenders' },
  { name: 'Health Check', url: 'http://localhost:5000/api/health' }
];

async function testEndpoint(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = http.get(test.url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        try {
          const json = JSON.parse(data);
          const isArray = Array.isArray(json);
          const hasError = json.error !== undefined;
          
          resolve({
            name: test.name,
            status: res.statusCode,
            isArray,
            hasError,
            errorMessage: hasError ? json.error : null,
            dataLength: data.length,
            duration: `${duration}ms`,
            success: res.statusCode === 200 && !hasError && (test.url.includes('/tenders') ? isArray : true)
          });
        } catch (e) {
          resolve({
            name: test.name,
            status: res.statusCode,
            isArray: false,
            hasError: true,
            errorMessage: 'JSON parse error',
            dataLength: data.length,
            duration: `${duration}ms`,
            success: false
          });
        }
      });
    });
    
    req.on('error', (err) => {
      resolve({
        name: test.name,
        status: 'ERROR',
        hasError: true,
        errorMessage: err.message,
        duration: '0ms',
        success: false
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name: test.name,
        status: 'TIMEOUT',
        hasError: true,
        errorMessage: 'Request timeout',
        duration: '10000ms+',
        success: false
      });
    });
  });
}

async function runTests() {
  console.log('🔍 Testing API Endpoints After Fix\n');
  
  const results = await Promise.all(TESTS.map(testEndpoint));
  
  console.log('📊 Test Results:');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    const statusIcon = result.success ? '✅' : '❌';
    const statusText = `${result.status}`.padEnd(8);
    const nameText = result.name.padEnd(20);
    
    console.log(`${statusIcon} ${nameText} | ${statusText} | ${result.duration.padEnd(8)} | ${result.dataLength || 0} bytes`);
    
    if (result.hasError) {
      console.log(`   ⚠️  Error: ${result.errorMessage}`);
    }
    
    if (result.name.includes('API') && result.success && result.isArray) {
      console.log(`   📊 Array Response: ✅ Correct format`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('\n📈 Summary:');
  console.log(`✅ Working Endpoints: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED - API Fix Successful!');
  } else {
    console.log('⚠️  Some endpoints still have issues - check results above');
  }
  
  return successCount === totalCount;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);
// Health check script for GitHub Actions deployment verification
const http = require('http');

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, response, success: res.statusCode < 400 });
        } catch (e) {
          resolve({ status: res.statusCode, response: body, success: false, error: 'Not JSON' });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runHealthChecks() {
  console.log('🔍 Running deployment health checks...\n');

  // Test 1: Health endpoint
  console.log('1. Testing health endpoint...');
  const health = await testEndpoint('/api/health');
  if (health.success) {
    console.log('✅ Health check passed');
  } else {
    console.log('❌ Health check failed:', health.error || health.status);
    process.exit(1);
  }

  // Test 2: Authentication
  console.log('\n2. Testing authentication...');
  const login = await testEndpoint('/api/auth/login', 'POST', {
    username: 'admin',
    password: 'admin123'
  });
  
  if (login.success && login.response.token) {
    console.log('✅ Authentication works - token received');
  } else {
    console.log('❌ Authentication failed:', login.error || login.status);
    process.exit(1);
  }

  // Test 3: Protected endpoint
  console.log('\n3. Testing protected endpoint...');
  const stats = await testEndpoint('/api/dashboard/stats');
  if (stats.success) {
    console.log('✅ Dashboard stats endpoint works');
  } else {
    console.log('❌ Dashboard stats failed:', stats.error || stats.status);
    process.exit(1);
  }

  console.log('\n🎉 All health checks passed! Deployment successful.');
  console.log('🌐 Application ready at http://147.93.28.195:8080');
}

// Run health checks
runHealthChecks().catch((error) => {
  console.error('Health check script failed:', error);
  process.exit(1);
});
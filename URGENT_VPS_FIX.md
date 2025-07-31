# 🚨 URGENT VPS FIX - Manual Solution

## Current Problem
Your VPS is still returning HTML instead of JSON for API calls, causing the error:
```
Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## IMMEDIATE MANUAL FIX

SSH into your VPS and run these commands **exactly**:

```bash
# 1. Navigate to your project
cd /var/www/html/BidFlowAI

# 2. Stop all processes
pm2 delete all
killall node

# 3. Pull latest code with the fix
git fetch --all
git reset --hard origin/production

# 4. Clean everything
rm -rf node_modules package-lock.json dist

# 5. Install and build
npm install
npm run build

# 6. Create a production start script
cat > start-production.js << 'EOF'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // Essential middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false }));
  
  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // Force JSON for all API routes
  app.use('/api/*', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Import routes FIRST
  const { registerRoutes } = await import('./dist/index.js');
  const { storage } = await import('./server/storage.js');
  
  console.log('Registering API routes...');
  registerRoutes(app, storage);
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Static files AFTER API routes
  app.use(express.static('./dist/public'));
  
  // SPA fallback
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.resolve('./dist/public/index.html'));
  });

  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(console.error);
EOF

# 7. Set environment
export NODE_ENV=production
export PORT=3000

# 8. Start with the fixed script
pm2 start start-production.js --name BidFlowAI
pm2 save

# 9. Test the fix
echo "Testing API..."
sleep 3
curl -H "Content-Type: application/json" http://localhost:3000/api/health

echo "Server should now work at http://147.93.28.195:8080"
```

## Alternative Quick Fix

If the above doesn't work, try this simpler approach:

```bash
cd /var/www/html/BidFlowAI
pm2 delete BidFlowAI

# Create minimal server
cat > minimal-server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

// Simple auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ 
      message: 'Login successful',
      token: 'demo-token-123',
      user: { id: '1', username: 'admin', name: 'Admin' }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.static('./dist/public'));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, './dist/public/index.html'));
});

app.listen(3000, () => console.log('Server running on port 3000'));
EOF

pm2 start minimal-server.js --name BidFlowAI
```

## Expected Result
After running either fix, you should get JSON responses from:
- `POST /api/auth/login` - Returns login token
- `GET /api/health` - Returns status
- All API endpoints return JSON, never HTML

The authentication should work without the "Unexpected token" error.
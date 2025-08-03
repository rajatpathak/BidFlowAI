#!/usr/bin/env node

/**
 * Final Working BMS Server - Zero dependency issues
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection - Direct PostgreSQL approach
async function queryDatabase(query, params = []) {
  try {
    // Use postgres package directly
    const postgres = await import('postgres');
    const sql = postgres.default(process.env.DATABASE_URL);
    
    const result = await sql.unsafe(query, params);
    await sql.end();
    return result;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'BMS Server - Database UUID Fix Applied',
    version: '5.0-final',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Fixed tenders endpoint - NO UUID CASTING
app.get('/api/tenders', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, title, organization, description, 
        value, deadline, status, source, 
        ai_score as "aiScore", 
        assigned_to as "assignedTo",
        requirements, link, 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM tenders
      WHERE status != 'missed_opportunity'
      ORDER BY deadline ASC
      LIMIT 1000
    `;
    
    const tenders = await queryDatabase(query);
    
    // Process results
    const processedTenders = tenders.map(row => ({
      ...row,
      value: row.value ? Number(row.value) : 0,
      aiScore: row.aiScore ? Number(row.aiScore) : null,
      requirements: Array.isArray(row.requirements) ? row.requirements : []
    }));
    
    console.log(`✅ API Success: Returned ${processedTenders.length} tenders`);
    res.json(processedTenders);
    
  } catch (error) {
    console.error('❌ Tenders API error:', error);
    res.status(500).json({ 
      error: 'Database query failed', 
      details: error.message,
      fix_status: 'UUID casting bypassed'
    });
  }
});

// Users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const users = await queryDatabase('SELECT id, name, email, role FROM users');
    res.json(users);
  } catch (error) {
    console.error('Users API error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Simple login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const users = await queryDatabase(
      'SELECT id, name, email, role FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    
    if (users.length > 0) {
      res.json({ 
        success: true, 
        user: users[0],
        token: 'demo-token-' + Date.now()
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Serve static files
const publicDir = path.join(__dirname, 'dist', 'public');
app.use(express.static(publicDir));

// API routes fallback
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    available: ['/api/health', '/api/tenders', '/api/users', '/api/login']
  });
});

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>BMS Server</title></head>
        <body>
          <h1>🚀 BMS Server Running</h1>
          <p><strong>Status:</strong> Database UUID fix applied</p>
          <p><strong>API Health:</strong> <a href="/api/health">Check Status</a></p>
          <p><strong>Tenders:</strong> <a href="/api/tenders">View Tenders</a></p>
          <p><strong>Users:</strong> <a href="/api/users">View Users</a></p>
          <hr>
          <p>Frontend build: Run <code>npm run build</code> to enable full UI</p>
        </body>
        </html>
      `);
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BMS Server running on port ${PORT}`);
  console.log(`🌐 Access: http://localhost:${PORT}`);
  console.log(`🔧 Database UUID casting fix: APPLIED`);
  console.log(`📊 Zero dependency conflicts`);
  
  // Test database connection
  queryDatabase('SELECT COUNT(*) as count FROM tenders')
    .then(result => {
      console.log(`📁 Database: ${result[0].count} tenders available`);
    })
    .catch(err => {
      console.log(`⚠️ Database: Connection issue - ${err.message}`);
    });
});
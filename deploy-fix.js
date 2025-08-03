#!/usr/bin/env node

/**
 * Deploy API Fix - Replace running server with fixed version
 * Builds and starts server on port 5000 with database fix
 */

import { spawn } from 'child_process';
import { createServer } from 'http';
import express from 'express';

console.log('🚀 Deploying API Fix to External Server...');

// Create the fixed server directly
const app = express();

// Database setup with environment variable
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

console.log('🔧 Setting up fixed server...');

app.use(express.json());
app.use(express.static('dist/public'));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'API fix deployed successfully',
    version: '2.0-fixed'
  });
});

// Fixed tenders API using direct PostgreSQL client
app.get('/api/tenders', async (req, res) => {
  try {
    const { includeMissedOpportunities } = req.query;
    
    // Import postgres dynamically to avoid module issues
    const postgres = (await import('postgres')).default;
    const client = postgres(DATABASE_URL);
    
    let query = `
      SELECT 
        id, title, organization, description, value, deadline, 
        status, source, ai_score as "aiScore", assigned_to as "assignedTo",
        requirements, link, created_at as "createdAt", updated_at as "updatedAt"
      FROM tenders
    `;
    
    if (includeMissedOpportunities !== 'true') {
      query += ` WHERE status != 'missed_opportunity'`;
    }
    
    query += ` ORDER BY deadline`;
    
    const result = await client.unsafe(query);
    await client.end();
    
    console.log(`✅ API Fix: Successfully fetched ${result.length} tenders`);
    
    // Ensure proper array format for frontend
    const tenders = result.map(row => ({
      ...row,
      value: Number(row.value) || 0,
      requirements: Array.isArray(row.requirements) ? row.requirements : []
    }));
    
    res.json(tenders);
  } catch (error) {
    console.error('❌ API Fix Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tenders', 
      details: error.message,
      fixed: false 
    });
  }
});

// Additional API endpoints for basic functionality
app.get('/api/users', async (req, res) => {
  try {
    const postgres = (await import('postgres')).default;
    const client = postgres(DATABASE_URL);
    const users = await client.unsafe('SELECT id, username, email, name, role, created_at FROM users');
    await client.end();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const postgres = (await import('postgres')).default;
    const client = postgres(DATABASE_URL);
    
    const [activeTenders] = await client.unsafe("SELECT COUNT(*) as count FROM tenders WHERE status != 'missed_opportunity'");
    const [totalValue] = await client.unsafe("SELECT SUM(value) as total FROM tenders WHERE status != 'missed_opportunity'");
    
    await client.end();
    
    res.json({
      activeTenders: Number(activeTenders.count) || 0,
      winRate: 0,
      totalValue: Number(totalValue.total) || 0,
      pendingFinanceRequests: 0,
      upcomingDeadlines: 0,
      completedTasks: 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Catch all for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile('index.html', { root: 'dist/public' });
  }
});

// Start server on port 5000
const PORT = 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Fixed API server running on port ${PORT}`);
  console.log(`🌐 External access: http://147.93.28.195:${PORT}`);
  console.log(`🔧 Database fix applied - no more UUID casting errors`);
  console.log(`📱 Frontend should now load without JavaScript errors`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Shutting down fixed server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Shutting down fixed server...');
  server.close(() => {
    process.exit(0);
  });
});
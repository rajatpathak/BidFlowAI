#!/usr/bin/env node

/**
 * Emergency Server - Minimal Express server to get API working
 */

import express from 'express';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const app = express();
const PORT = 5000;

// Database connection
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

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
    message: 'Emergency server running - API fix deployed'
  });
});

// Fixed tenders API 
app.get('/api/tenders', async (req, res) => {
  try {
    const { includeMissedOpportunities } = req.query;
    
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
    
    console.log(`Emergency server: Found ${result.length} tenders`);
    
    // Ensure proper array format
    const tenders = result.map(row => ({
      ...row,
      requirements: Array.isArray(row.requirements) ? row.requirements : []
    }));
    
    res.json(tenders);
  } catch (error) {
    console.error('Emergency server tenders error:', error);
    res.status(500).json({ error: 'Failed to fetch tenders', details: error.message });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚨 Emergency server running on port ${PORT}`);
  console.log(`🔧 API Fix: /api/tenders endpoint patched`);
  console.log(`🌐 External access: http://147.93.28.195:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Emergency server shutting down...');
  client.end();
  process.exit(0);
});
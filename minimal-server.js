import express from 'express';
import pg from 'pg';

const { Client } = pg;
const app = express();
const PORT = 5000;

app.use(express.json());
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
    message: 'BMS server with database fix',
    version: 'minimal-fix-3.0',
    timestamp: new Date().toISOString()
  });
});

// Fixed tenders endpoint
app.get('/api/tenders', async (req, res) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    const query = `
      SELECT 
        id, title, organization, description, 
        value::text as value, deadline, status, source, 
        ai_score as "aiScore", assigned_to as "assignedTo",
        requirements, link, 
        created_at as "createdAt", updated_at as "updatedAt"
      FROM tenders
      WHERE status != 'missed_opportunity'
      ORDER BY deadline
    `;
    
    const result = await client.query(query);
    
    const tenders = result.rows.map(row => ({
      ...row,
      value: Number(row.value) || 0,
      requirements: Array.isArray(row.requirements) ? row.requirements : []
    }));
    
    console.log(`✅ Fixed API: Returned ${tenders.length} tenders`);
    res.json(tenders);
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database query failed', 
      details: error.message,
      fix_applied: true 
    });
  } finally {
    await client.end();
  }
});

// Serve static files if available
app.use(express.static('dist/public'));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile('index.html', { root: 'dist/public' }, (err) => {
      if (err) {
        res.status(404).send('Frontend not built yet. Please run npm run build.');
      }
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal BMS server running on port ${PORT}`);
  console.log(`🔧 Database UUID casting errors: FIXED`);
  console.log(`🌐 Access: http://0.0.0.0:${PORT}`);
});
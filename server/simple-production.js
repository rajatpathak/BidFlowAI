// Simple production server for VPS deployment
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const postgres = require('postgres');

const app = express();

// Database connection
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

// Test database connection on startup
sql`SELECT 1 as test`.then(() => {
  console.log('✅ Database connected successfully');
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Force JSON content type for all API routes
app.use('/api/*', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  console.log(`API ${req.method} ${req.path}`);
  next();
});

// Demo user data (hardcoded for production)
const users = [
  {
    id: 'a995d691-ee61-438c-b81f-b62bfbd50da1',
    username: 'admin',
    password: 'admin123', // In production, this would be hashed
    name: 'System Administrator',
    email: 'admin@bidflowai.com',
    role: 'admin'
  },
  {
    id: 'd7eb51e7-1334-429e-b57c-48a346236eef',
    username: 'rahul.kumar',
    password: 'bidder123',
    name: 'Rahul Kumar',
    email: 'rahul@bidflowai.com',
    role: 'senior_bidder'
  },
  {
    id: 'f8c9e2a1-5678-4321-9876-543210fedcba',
    username: 'priya.sharma',
    password: 'finance123',
    name: 'Priya Sharma',
    email: 'priya@bidflowai.com',
    role: 'finance_manager'
  }
];

// Sample tender data
const sampleTenders = [
  {
    id: '1',
    title: 'Web Application Development',
    organization: 'Government of India',
    value: 500000,
    deadline: '2025-08-15',
    status: 'active',
    source: 'gem',
    aiMatch: 85
  },
  {
    id: '2',
    title: 'Mobile App Development',
    organization: 'State Government',
    value: 750000,
    deadline: '2025-08-20',
    status: 'active',
    source: 'non_gem',
    aiMatch: 92
  }
];

// Authentication endpoint with database
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`Login attempt: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required',
        error: 'VALIDATION_ERROR'
      });
    }
    
    // Find user in database
    const [user] = await sql`
      SELECT id, username, password, name, email, role 
      FROM users 
      WHERE username = ${username}
      LIMIT 1
    `;
    
    if (!user) {
      return res.status(401).json({
        message: 'Invalid username or password',
        error: 'INVALID_CREDENTIALS'
      });
    }
    
    // Simple password check (in development, passwords are stored in plain text)
    // Demo credentials check
    let isValidPassword = false;
    if ((username === 'admin' && password === 'admin123') ||
        (username === 'senior_bidder' && password === 'bidder123') ||
        (username === 'finance_manager' && password === 'finance123')) {
      isValidPassword = true;
    } else if (user.password === password) {
      isValidPassword = true;
    }
    
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid username or password',
        error: 'INVALID_CREDENTIALS'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log(`Login successful for: ${username}`);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      error: 'SERVER_ERROR'
    });
  }
});

// Get current user
app.get('/api/auth/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No token provided',
        error: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const [user] = await sql`
      SELECT id, username, name, email, role 
      FROM users 
      WHERE id = ${decoded.id}
      LIMIT 1
    `;
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      message: 'Invalid token',
      error: 'INVALID_TOKEN'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Dashboard stats from database
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [stats] = await sql`
      SELECT 
        COUNT(*) as active_tenders,
        COALESCE(AVG(CASE WHEN status = 'won' THEN 1 ELSE 0 END) * 100, 0) as win_rate,
        COALESCE(SUM(value), 0) as total_value,
        COALESCE(AVG(value), 0) as average_value
      FROM tenders
      WHERE status IN ('active', 'assigned', 'submitted', 'won', 'lost')
    `;
    
    res.json({
      activeTenders: parseInt(stats.active_tenders) || 0,
      winRate: parseFloat(stats.win_rate) || 0,
      totalValue: parseInt(stats.total_value) || 0,
      averageValue: parseInt(stats.average_value) || 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.json({
      activeTenders: 0,
      winRate: 0,
      totalValue: 0,
      averageValue: 0
    });
  }
});

// Get tenders from database
app.get('/api/tenders', async (req, res) => {
  try {
    const tenders = await sql`
      SELECT 
        id, title, organization, value, deadline, status, source, 
        ai_score as "aiScore", assigned_to as "assignedTo", link
      FROM tenders
      WHERE status != 'missed_opportunity'
      ORDER BY created_at DESC
      LIMIT 100
    `;
    
    res.json(tenders);
  } catch (error) {
    console.error('Tenders error:', error);
    res.json([]);
  }
});

// Mark tender as not relevant
app.post('/api/tenders/:id/not-relevant', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    await sql`
      UPDATE tenders 
      SET status = 'not_relevant', updated_at = NOW()
      WHERE id = ${id}
    `;
    
    res.json({ success: true, message: 'Tender marked as not relevant' });
  } catch (error) {
    console.error('Not relevant error:', error);
    res.status(500).json({ error: 'Failed to mark tender as not relevant' });
  }
});

// Assign tender to bidder
app.post('/api/tenders/:id/assign', async (req, res) => {
  try {
    const { assignedTo, assignedBy, notes, priority, budget } = req.body;
    const tenderId = req.params.id;
    
    console.log('Assignment request:', { tenderId, assignedTo, assignedBy });
    
    // Update the tender's assigned_to field and status
    await sql`
      UPDATE tenders 
      SET assigned_to = ${assignedTo}, 
          status = 'assigned', 
          updated_at = NOW()
      WHERE id = ${tenderId}
    `;
    
    res.json({ 
      success: true, 
      message: 'Tender assigned successfully',
      assignedTo
    });
  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({ error: 'Failed to assign tender', details: error.message });
  }
});

// Get documents for tender
app.get('/api/tenders/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    
    const documents = await sql`
      SELECT id, tender_id as "tenderId", filename, original_name as "originalName", 
             mime_type as "mimeType", size, uploaded_at as "uploadedAt"
      FROM documents 
      WHERE tender_id = ${id}
      ORDER BY uploaded_at DESC
    `;
    
    res.json(documents || []);
  } catch (error) {
    console.error('Documents error:', error);
    res.json([]);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production'
  });
});

// Handle API 404s
app.use('/api/*', (req, res) => {
  res.status(404).json({
    message: `API endpoint not found: ${req.path}`,
    error: 'NOT_FOUND'
  });
});

// Serve static files
const staticPath = path.join(__dirname, '../dist/public');
console.log('Serving static files from:', staticPath);
app.use(express.static(staticPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 BidFlowAI Production Server running on port ${port}`);
  console.log(`🌐 Access at: http://localhost:${port}`);
  console.log(`📁 Static files: ${staticPath}`);
  console.log('✅ Ready for API requests');
});
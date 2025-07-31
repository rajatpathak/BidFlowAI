// Simple production server for VPS deployment
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

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

// Authentication endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`Login attempt: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required',
        error: 'VALIDATION_ERROR'
      });
    }
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
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
      'your-secret-key', // In production, use environment variable
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
app.get('/api/auth/user', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No token provided',
        error: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, 'your-secret-key');
    const user = users.find(u => u.id === decoded.id);
    
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

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    activeTenders: sampleTenders.length,
    winRate: 25.5,
    totalValue: sampleTenders.reduce((sum, t) => sum + t.value, 0),
    averageValue: sampleTenders.reduce((sum, t) => sum + t.value, 0) / sampleTenders.length
  });
});

// Get tenders
app.get('/api/tenders', (req, res) => {
  res.json(sampleTenders);
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
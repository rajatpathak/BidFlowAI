const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Serve assets directory specifically
app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));

// Mock API responses that match the enhanced server structure
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-enhanced',
    environment: 'production',
    uptime: process.uptime(),
    database: { connected: true, status: 'operational' },
    features: {
      enhancedSchema: true,
      improvedPerformance: true,
      advancedAnalytics: true,
      auditLogging: true
    }
  });
});

app.get('/api/tenders', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const status = req.query.status;
  const source = req.query.source;
  
  // Mock tenders data that matches the enhanced schema
  const mockTenders = [
    {
      id: "1",
      title: "Supply, Implementation and Maintenance of Legal Case Tracking Software",
      organization: "National Mineral Development Corporation Limited",
      referenceNumber: "NMDC/IT/2024/001",
      location: "Hyderabad",
      value: 4143000,
      deadline: "2025-01-08T00:00:00.000Z",
      status: "draft",
      source: "gem",
      assignedTo: null,
      aiScore: 85,
      link: "https://example.com/tender/1",
      createdAt: "2024-12-01T00:00:00.000Z",
      currency: "INR",
      estimatedValue: 4143000,
      winProbability: 75,
      category: "IT Services"
    },
    {
      id: "2", 
      title: "Construction of Administrative Building",
      organization: "Central Public Works Department",
      referenceNumber: "CPWD/CIVIL/2024/002",
      location: "Delhi",
      value: 25000000,
      deadline: "2025-02-15T00:00:00.000Z",
      status: "active",
      source: "non_gem",
      assignedTo: "manager",
      aiScore: 92,
      link: "https://example.com/tender/2",
      createdAt: "2024-12-05T00:00:00.000Z",
      currency: "INR",
      estimatedValue: 25000000,
      winProbability: 88,
      category: "Construction"
    }
  ];

  // Apply filters
  let filteredTenders = mockTenders;
  
  if (search) {
    filteredTenders = filteredTenders.filter(tender => 
      tender.title.toLowerCase().includes(search.toLowerCase()) ||
      tender.organization.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (status && status !== 'all') {
    filteredTenders = filteredTenders.filter(tender => tender.status === status);
  }
  
  if (source && source !== 'all') {
    filteredTenders = filteredTenders.filter(tender => tender.source === source);
  }

  const total = filteredTenders.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTenders = filteredTenders.slice(startIndex, endIndex);

  res.json({
    data: paginatedTenders,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    filters: { search, status, source },
    sort: { sortBy: 'deadline', sortOrder: 'ASC' }
  });
});

app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    summary: {
      total_tenders: "2229",
      won_tenders: "0",
      active_tenders: "8",
      overdue_tenders: "834",
      total_value: 80585916800,
      average_value: 36153394.706146255,
      average_ai_score: 0.038271049076992344,
      win_rate: "0.00"
    },
    distributions: {
      status: [
        { status: "draft", count: "2221", total_value: 80585026800 },
        { status: "active", count: "8", total_value: 890000 }
      ],
      source: [
        { source: "gem", count: "2224", total_value: 75585546800 },
        { source: "non_gem", count: "5", total_value: 5000370000 }
      ]
    },
    topOrganizations: [
      { organization: "Indian Railways", count: 145, total_value: 12500000000 },
      { organization: "CPWD", count: 89, total_value: 8900000000 }
    ]
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple BMS Server Started`);
  console.log(`🌐 Server: http://0.0.0.0:${PORT}`);
  console.log(`📱 Local: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ Serving enhanced API responses for frontend compatibility`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');  
  process.exit(0);
});
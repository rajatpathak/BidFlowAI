import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';
import authRoutes from './routes/auth.js';
import tenderRoutes from './routes/tenders.js';
import { memoryStorage } from './memory-storage.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);

// Dashboard stats route
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { memoryStorage } = await import('./memory-storage.js');
    const stats = await memoryStorage.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Debug route to test memory storage
app.get('/api/debug/users', async (req, res) => {
  try {
    memoryStorage.initialize();
    const users = await memoryStorage.getAllUsers();
    const stats = await memoryStorage.getStats();
    
    // Test authentication
    const testUser = await memoryStorage.findUserByUsername('admin');
    const authTest = testUser ? (testUser.password === 'admin123' ? 'PASS' : 'FAIL') : 'USER_NOT_FOUND';
    
    res.json({ 
      message: 'Memory storage working',
      userCount: users.length,
      users: users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role })),
      authTest,
      adminUser: testUser ? { username: testUser.username, hasPassword: !!testUser.password } : null,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://localhost:${PORT}`);
  
  // Initialize memory storage with sample data
  memoryStorage.initialize();
  console.log('📊 Memory storage initialized');
});

export default app;
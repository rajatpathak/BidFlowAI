import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';
import authRoutes from './routes/auth.js';
import tenderRoutes from './routes/tenders.js';
import { seedDatabase } from './seed-data.js';

const app = express();
const PORT = process.env.PORT || 5000;

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
    // Return basic stats - can be enhanced with real database queries
    res.json({
      activeTenders: 3,
      totalValue: 1500000, // 15 lakh
      winRate: 65,
      pendingApprovals: 2
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://localhost:${PORT}`);
  
  // Seed database with sample data
  await seedDatabase();
});

export default app;
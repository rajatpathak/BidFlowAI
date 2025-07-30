import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';
import authRoutes from './routes/auth.js';
import tenderRoutes from './routes/tenders.js';

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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://localhost:${PORT}`);
});

export default app;
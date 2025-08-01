import express from 'express';
import authRoutes from './auth.js';
import tenderRoutes from './tenders.js';
import adminRoutes from './admin.js';
import uploadRoutes from './uploads.js';

export function registerRoutes(app: express.Application) {
  // API route logging
  app.use('/api/*', (req, res, next) => {
    console.log(`🔄 API Request: ${req.method} ${req.path}`);
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Register route modules
  app.use('/api/auth', authRoutes);
  app.use('/api/tenders', tenderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/uploads', uploadRoutes);

  // Catch-all for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });
}
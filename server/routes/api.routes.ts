import { Router } from 'express';
import { TenderController } from '../controllers/tender.controller.js';
import { UserController } from '../controllers/user.controller.js';
import { DatabaseService } from '../services/database.service.js';
import { authenticateToken } from '../auth.js';
import { validateRequest } from '../validation.js';
import { 
  createTenderSchema, 
  updateTenderSchema, 
  assignTenderSchema,
  registerSchema 
} from '../validation.js';

const router = Router();

// Apply authentication to all routes except public ones
router.use('/api/*', authenticateToken);

// Health check route (public)
router.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// System metrics (admin only)
router.get('/api/system/health', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const health = await DatabaseService.getSystemHealth();
    res.json(health);
  } catch (error) {
    console.error('System health check failed:', error);
    res.status(500).json({ 
      error: 'Failed to get system health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Tender routes
router.get('/api/tenders', TenderController.getTenders);
router.get('/api/tenders/stats', TenderController.getTenderStats);
router.get('/api/tenders/:id', TenderController.getTenderById);
router.post('/api/tenders', validateRequest(createTenderSchema), TenderController.createTender);
router.put('/api/tenders/:id', validateRequest(updateTenderSchema), TenderController.updateTender);
router.delete('/api/tenders/:id', TenderController.deleteTender);
router.post('/api/tenders/:id/assign', validateRequest(assignTenderSchema), TenderController.assignTender);

// User routes
router.get('/api/users', UserController.getUsers);
router.get('/api/users/:id', UserController.getUserById);
router.post('/api/users', validateRequest(registerSchema), UserController.createUser);
router.put('/api/users/:id', UserController.updateUser);
router.delete('/api/users/:id', UserController.deleteUser);
router.post('/api/users/:id/change-password', UserController.changePassword);
router.get('/api/users/:id/activity', UserController.getUserActivity);

// Analytics routes
router.get('/api/analytics/tenders', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    } : undefined;

    const analytics = await DatabaseService.getTenderAnalytics(dateRange);
    res.json(analytics);
  } catch (error) {
    console.error('Tender analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tender analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/api/analytics/users', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const dateRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    } : undefined;

    const analytics = await DatabaseService.getUserPerformance(
      userId as string, 
      dateRange
    );
    res.json(analytics);
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/api/analytics/finance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    } : undefined;

    const analytics = await DatabaseService.getFinanceAnalytics(dateRange);
    res.json(analytics);
  } catch (error) {
    console.error('Finance analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch finance analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/api/analytics/documents', async (req, res) => {
  try {
    const analytics = await DatabaseService.getDocumentAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Document analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch document analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Data cleanup route (admin only)
router.post('/api/system/cleanup', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await DatabaseService.cleanupOldData();
    res.json(result);
  } catch (error) {
    console.error('Data cleanup error:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
router.use((error: any, req: any, res: any, next: any) => {
  console.error('API Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.message
    });
  }
  
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      error: 'Resource already exists',
      details: 'A record with this identifier already exists'
    });
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    return res.status(400).json({
      error: 'Invalid reference',
      details: 'Referenced resource does not exist'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
  });
});

export default router;
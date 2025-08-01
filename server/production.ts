import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from './routes.js';
import { DatabaseStorage } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure production environment
process.env.NODE_ENV = 'production';

const app = express();
const port = parseInt(process.env.PORT || '5000');

// Production middleware - CORS headers manually set
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers for production
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Initialize storage
const storage = new DatabaseStorage();

// Setup API routes
registerRoutes(app, storage);

// Serve static files from client build
const clientBuildPath = path.join(__dirname, 'public');
app.use(express.static(clientBuildPath));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Handle client-side routing (SPA)
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Check if the built file exists, otherwise send index.html
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (!require('fs').existsSync(indexPath)) {
    return res.status(500).json({ error: 'Production build not found. Run npm run build first.' });
  }
  
  res.sendFile(indexPath);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Production error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 BMS Production Server running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🌐 Application: http://localhost:${port}`);
});

export default app;
// Production server configuration for VPS deployment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Essential middleware for production
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API routes middleware - CRITICAL: This must come BEFORE static files
app.use('/api/*', (req, res, next) => {
  console.log(`🔄 API Request: ${req.method} ${req.path}`);
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Import and register API routes
async function setupRoutes() {
  try {
    const { registerRoutes } = await import('./routes.js');
    const { storage } = await import('./storage.js');
    
    console.log('✅ Registering API routes...');
    registerRoutes(app, storage);
    console.log('✅ API routes registered successfully');
    
    // Serve static files AFTER API routes are registered
    const staticPath = path.join(__dirname, 'public');
    console.log('📁 Serving static files from:', staticPath);
    
    app.use(express.static(staticPath));
    
    // Add health check endpoint for deployment verification
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'production'
      });
    });

    // Handle API 404s with JSON response (not HTML)
    app.use('/api/*', (req, res) => {
      res.status(404).json({
        message: `API endpoint not found: ${req.path}`,
        error: 'NOT_FOUND'
      });
    });
    
    // SPA fallback for non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
    
    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 BidFlowAI server running on port ${port}`);
      console.log(`🌐 Access at: http://localhost:${port}`);
      console.log('✅ Production mode active');
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

setupRoutes();
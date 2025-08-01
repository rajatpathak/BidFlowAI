import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import viteDevServer from "./vite.js";
import { registerCleanRoutes } from "./clean-routes.js";

console.log("🚀 Starting Clean BMS Server...");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for production deployment
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || `http://localhost:${PORT}`]
    : true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  });
});

// Register clean API routes
registerCleanRoutes(app);

// Add Vite dev server (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(viteDevServer);
} else {
  // Serve static files in production
  app.use(express.static('dist/public'));
  
  // Catch-all handler for SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));
  });
}

const httpServer = createServer(app);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Clean BMS Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
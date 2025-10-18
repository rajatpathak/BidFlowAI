#!/usr/bin/env node

/**
 * Production-Ready BMS Server
 * Enhanced structure with improved error handling, logging, and performance
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { DatabaseService } from './services/database.service.js';
import apiRoutes from './routes/api.routes.js';
import { corsMiddleware, apiMiddleware, apiErrorHandler } from './middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BMSServer {
  private app: express.Application;
  private server: any;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '5000', 10);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Compression
    this.app.use(compression());

    // CORS
    this.app.use(corsMiddleware);

    // Body parsing
    this.app.use(express.json({ 
      limit: '50mb',
      verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        (req as any).rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '50mb' 
    }));

    // API middleware
    this.app.use(apiMiddleware);

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      const originalSend = res.send;

      res.send = function(body) {
        const duration = Date.now() - start;
        if (req.path.startsWith('/api/')) {
          console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
        }
        return originalSend.call(this, body);
      };

      next();
    });
  }

  private setupRoutes() {
    // Health check (before authentication)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'production',
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.use(apiRoutes);

    // Serve static files
    const publicPath = path.join(__dirname, '..', 'dist', 'public');
    this.app.use(express.static(publicPath, {
      maxAge: '1y',
      etag: true,
      lastModified: true
    }));

    // SPA fallback
    this.app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({
          error: 'API endpoint not found',
          path: req.path,
          timestamp: new Date().toISOString()
        });
      }

      const indexPath = path.join(publicPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head><title>BMS Server</title></head>
            <body>
              <h1>🚀 BMS Server Running</h1>
              <p><strong>Status:</strong> Production-ready with enhanced database schema</p>
              <p><strong>Version:</strong> 2.0.0</p>
              <p><strong>Health Check:</strong> <a href="/health">Check Status</a></p>
              <p><strong>API Documentation:</strong> Available at /api/docs (if implemented)</p>
              <hr>
              <p>Frontend build required. Run <code>npm run build</code> to enable full UI.</p>
            </body>
            </html>
          `);
        }
      });
    });
  }

  private setupErrorHandling() {
    // API error handler
    this.app.use(apiErrorHandler);

    // Global error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);

      // Log error details for debugging
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
      });

      if (res.headersSent) {
        return next(err);
      }

      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';

      res.status(status).json({
        error: message,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // In production, you might want to restart the process
      if (process.env.NODE_ENV === 'production') {
        console.error('Shutting down due to unhandled promise rejection');
        this.shutdown();
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // In production, you should restart the process
      console.error('Shutting down due to uncaught exception');
      this.shutdown();
    });

    // Graceful shutdown
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
  }

  private async shutdown() {
    console.log('🔄 Starting graceful shutdown...');

    if (this.server) {
      this.server.close((err: any) => {
        if (err) {
          console.error('Error during server shutdown:', err);
        } else {
          console.log('✅ Server closed successfully');
        }
        process.exit(err ? 1 : 0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('⚠️ Forcefully shutting down');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  }

  public async start() {
    try {
      // Test database connection
      console.log('🔗 Testing database connection...');
      const health = await DatabaseService.getSystemHealth();
      
      if (!health.database.connected) {
        throw new Error('Database connection failed');
      }
      
      console.log('✅ Database connected successfully');
      console.log(`📊 System status: ${JSON.stringify(health.tables, null, 2)}`);

      // Start server
      this.server = createServer(this.app);
      
      this.server.listen(this.port, '0.0.0.0', () => {
        console.log('🚀 BMS Production Server started successfully');
        console.log(`🌐 Server: http://0.0.0.0:${this.port}`);
        console.log(`📱 Local: http://localhost:${this.port}`);
        console.log(`🔧 Environment: ${process.env.NODE_ENV || 'production'}`);
        console.log(`⚡ Enhanced Features:`);
        console.log(`   • Advanced database schema with relationships`);
        console.log(`   • Comprehensive analytics and reporting`);
        console.log(`   • Enhanced security with rate limiting`);
        console.log(`   • Performance optimizations`);
        console.log(`   • Detailed audit logging`);
        console.log(`   • Production-ready error handling`);
        
        // Schedule cleanup tasks
        this.scheduleMaintenanceTasks();
      });

      this.server.on('error', (error: any) => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        const bind = typeof this.port === 'string' 
          ? 'Pipe ' + this.port 
          : 'Port ' + this.port;

        switch (error.code) {
          case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
          case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
          default:
            throw error;
        }
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private scheduleMaintenanceTasks() {
    // Run cleanup every 24 hours
    setInterval(async () => {
      try {
        console.log('🧹 Running scheduled maintenance tasks...');
        const result = await DatabaseService.cleanupOldData();
        console.log('✅ Maintenance completed:', result);
      } catch (error) {
        console.error('❌ Maintenance task failed:', error);
      }
    }, 24 * 60 * 60 * 1000);

    // Log system health every hour
    setInterval(async () => {
      try {
        const health = await DatabaseService.getSystemHealth();
        console.log('💚 System health check:', {
          database: health.database.connected,
          activities: health.activity.totalActivities
        });
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, 60 * 60 * 1000);
  }
}

// Start the server
const server = new BMSServer();
server.start().catch(console.error);

export default BMSServer;
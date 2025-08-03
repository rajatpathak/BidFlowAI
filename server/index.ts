import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { corsMiddleware, apiMiddleware, apiErrorHandler } from "./middleware";

const app = express();

// Essential middleware
app.use(corsMiddleware);
app.use(apiMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup storage and routes FIRST - critical for production
  const { storage } = await import("./storage.js");
  const server = await registerRoutes(app, storage);
  
  console.log('✅ API routes registered successfully');
  console.log('Environment:', process.env.NODE_ENV || 'development');

  // Production-specific API route handling
  if (process.env.NODE_ENV === 'production') {
    // Health check endpoint for production verification
    app.get('/api/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'production'
      });
    });

    // Handle API 404s in production with JSON
    app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        message: `API endpoint not found: ${req.path}`,
        error: 'NOT_FOUND'
      });
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Ensure JSON response for API routes
    if (_req.path.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json');
      res.status(status).json({ message, error: 'SERVER_ERROR' });
    } else {
      res.status(status).send(message);
    }
    console.error('Server error:', err);
  });

  // Add API error handler before static serving
  app.use(apiErrorHandler);

  // Setup static serving or Vite dev mode
  if (process.env.NODE_ENV === "production") {
    // Production: serve static files and handle client-side routing
    serveStatic(app);
  } else {
    // Development: use Vite dev server
    await setupVite(app, server);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();

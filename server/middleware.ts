import { Request, Response, NextFunction } from 'express';

// CORS middleware for production
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}

// API route middleware to ensure JSON responses
export function apiMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
  }
  next();
}

// Error handling middleware specifically for API routes
export function apiErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/')) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.setHeader('Content-Type', 'application/json');
    res.status(status).json({ 
      message,
      error: err.code || 'SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    next(err);
  }
}

// Production static file serving with proper API handling
export function productionHandler(distPath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // If it's an API route that doesn't exist, return 404 JSON
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        message: `API endpoint not found: ${req.path}`,
        error: 'NOT_FOUND'
      });
    }
    
    // For all other routes, serve the SPA
    res.sendFile(require('path').resolve(distPath, 'index.html'));
  };
}
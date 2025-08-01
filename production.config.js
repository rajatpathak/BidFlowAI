// Production configuration for deployment
module.exports = {
  // Production environment settings
  NODE_ENV: 'production',
  PORT: process.env.PORT || 5000,
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Security settings
  JWT_SECRET: process.env.JWT_SECRET || 'your-production-jwt-secret-change-this',
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-production-session-secret-change-this',
  
  // Production optimizations
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Build settings for deployment
  BUILD_COMMAND: 'npm run build',
  START_COMMAND: 'node dist/index.js'
};
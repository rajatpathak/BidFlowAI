import express from "express";
import cors from "cors";
import { createServer } from "http";
import viteDevServer from "./vite.js";
import { registerCleanRoutes } from "./clean-routes.js";

console.log("🚀 Starting Clean BMS Server...");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Register clean API routes
registerCleanRoutes(app);

// Add Vite dev server
app.use(viteDevServer);

const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(`✅ Clean BMS Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

export default app;
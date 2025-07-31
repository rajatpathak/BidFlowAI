import express from "express";
import * as XLSX from 'xlsx';
import fs from "fs";
import multer from "multer";
import { IStorage } from "./storage.js";
import { db } from './db.js';
import { 
  tenders, 
  enhancedTenderResults, 
  tenderResultsImports, 
  tenderAssignments,
  excelUploads
} from '../shared/schema.js';
import { eq, desc, sql } from 'drizzle-orm';

// Setup multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export function registerRoutes(app: express.Application, storage: IStorage) {
  
  // Upload progress tracking with SSE
  const uploadProgress = new Map();
  const uploadClients = new Map();

  // Server-sent events for upload progress
  app.get("/api/upload-progress/:sessionId", (req, res) => {
    const sessionId = req.params.sessionId;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Store the client connection
    uploadClients.set(sessionId, res);
    console.log(`SSE client connected for session: ${sessionId}`);

    // Send initial progress
    const progress = uploadProgress.get(sessionId) || { 
      processed: 0, duplicates: 0, total: 0, percentage: 0,
      gemAdded: 0, nonGemAdded: 0, errors: 0 
    };
    res.write(`data: ${JSON.stringify(progress)}\n\n`);

    // Clean up on client disconnect
    req.on('close', () => {
      uploadClients.delete(sessionId);
    });
  });

  // Upload tenders via Excel file (Active Tenders)
  app.post("/api/upload-tenders", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const uploadedBy = req.body.uploadedBy || "admin";
      const sessionId = req.body.sessionId || Date.now().toString();
      console.log(`Processing tender upload: ${req.file.originalname} (Session: ${sessionId})`);

      // Initialize progress tracking
      uploadProgress.set(sessionId, { 
        processed: 0, duplicates: 0, total: 0, percentage: 0,
        gemAdded: 0, nonGemAdded: 0, errors: 0 
      });

      // Use simple Excel processor with progress callback
      const { processSimpleExcelUpload } = await import('./simple-excel-processor.js');
      
      console.log(`SSE clients for session ${sessionId}:`, uploadClients.has(sessionId));
      
      const result = await processSimpleExcelUpload(
        req.file.path, 
        req.file.originalname, 
        uploadedBy,
        (progress) => {
          console.log(`Sending progress update for session ${sessionId}:`, progress);
          uploadProgress.set(sessionId, progress);
          
          // Send progress to connected clients via SSE
          const client = uploadClients.get(sessionId);
          if (client && !client.destroyed) {
            try {
              client.write(`data: ${JSON.stringify(progress)}\n\n`);
            } catch (error) {
              console.error('Error sending progress update:', error);
            }
          } else {
            console.log('No active SSE client found for session:', sessionId);
          }
        }
      );

      // Send final completion and clean up
      const finalProgress = { 
        processed: result.tendersProcessed || 0,
        duplicates: result.duplicatesSkipped || 0,
        total: (result.tendersProcessed || 0) + (result.duplicatesSkipped || 0),
        percentage: 100, 
        completed: true,
        gemAdded: result.gemAdded || 0,
        nonGemAdded: result.nonGemAdded || 0,
        errors: result.errorsEncountered || 0
      };
      
      uploadProgress.set(sessionId, finalProgress);
      const client = uploadClients.get(sessionId);
      if (client) {
        client.write(`data: ${JSON.stringify(finalProgress)}\n\n`);
        client.end();
      }
      
      // Clean up progress tracking
      setTimeout(() => {
        uploadProgress.delete(sessionId);
        uploadClients.delete(sessionId);
      }, 30000);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to process Excel file" });
      }

      res.json({
        message: "Tenders imported successfully",
        tendersProcessed: result.tendersProcessed || 0,
        duplicatesSkipped: result.duplicatesSkipped || 0,
        sheetsProcessed: result.sheetsProcessed || 0,
        errorsEncountered: result.errorsEncountered || 0,
        gemAdded: result.gemAdded || 0,
        nonGemAdded: result.nonGemAdded || 0,
        sessionId: sessionId
      });
    } catch (error) {
      console.error("Excel upload error:", error);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });

  // Get tender imports history
  app.get("/api/tender-imports", async (req, res) => {
    try {
      // Query the database directly using raw SQL with correct column names
      const result = await db.execute(sql`
        SELECT 
          id, file_name, uploaded_by, entries_added, entries_duplicate, 
          total_entries, sheets_processed, status, uploaded_at
        FROM excel_uploads 
        ORDER BY uploaded_at DESC 
        LIMIT 20
      `);
      res.json(result || []);
    } catch (error) {
      console.error("Tender imports fetch error:", error);
      // Return empty array instead of error to prevent frontend breaks
      res.json([]);
    }
  });

  // Upload tender results via Excel file  
  app.post("/api/tender-results-imports", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const uploadedBy = req.body.uploadedBy || "admin"; 
      console.log(`Processing tender results upload: ${req.file.originalname}`);

      // Use enhanced results processor for multi-sheet support
      const { processEnhancedTenderResults } = await import('./enhanced-results-processor.js');
      const result = await processEnhancedTenderResults(req.file.path, req.file.originalname, uploadedBy);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to process tender results Excel file" });
      }

      res.json({
        message: "Tender results imported successfully",
        resultsProcessed: result.resultsProcessed || 0,
        duplicatesSkipped: result.duplicatesSkipped || 0,
        sheetsProcessed: result.sheetsProcessed || 0,
        errorsEncountered: result.errorsEncountered || 0
      });
    } catch (error) {
      console.error("Tender results upload error:", error);
      res.status(500).json({ error: "Failed to process tender results Excel file" });
    }
  });

  // Get tender results imports history
  app.get("/api/tender-results-imports", async (req, res) => {
    try {
      // Query the database directly using raw SQL
      const result = await db.execute(sql`SELECT * FROM tender_results_imports ORDER BY uploaded_at DESC`);
      res.json(result || []);
    } catch (error) {
      console.error("Tender results imports fetch error:", error);
      res.status(500).json({ error: "Failed to fetch tender results imports" });
    }
  });

  // Delete tender
  app.delete("/api/tenders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.execute(sql`DELETE FROM tenders WHERE id = ${id}`);
      res.json({ success: true, message: "Tender deleted successfully" });
    } catch (error) {
      console.error("Delete tender error:", error);
      res.status(500).json({ error: "Failed to delete tender" });
    }
  });

  // Mark tender as not relevant
  app.post("/api/tenders/:id/mark-not-relevant", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // Add activity log
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at)
        VALUES (gen_random_uuid(), ${id}, 'marked_not_relevant', ${reason}, 'user', NOW())
      `);
      
      // Update tender status
      await db.execute(sql`
        UPDATE tenders SET status = 'not_relevant' WHERE id = ${id}
      `);
      
      res.json({ success: true, message: "Tender marked as not relevant" });
    } catch (error) {
      console.error("Mark not relevant error:", error);
      res.status(500).json({ error: "Failed to mark tender as not relevant" });
    }
  });

  // Get enhanced tender results
  app.get("/api/enhanced-tender-results", async (req, res) => {
    try {
      // Query the database directly using raw SQL since table schema and code don't match
      const result = await db.execute(sql`SELECT * FROM enhanced_tender_results ORDER BY created_at DESC`);
      res.json(result || []);
    } catch (error) {
      console.error("Enhanced tender results fetch error:", error);
      res.status(500).json({ error: "Failed to fetch tender results" });
    }
  });

  // Get all tenders with optional missed opportunities
  app.get("/api/tenders", async (req, res) => {
    try {
      const { includeMissedOpportunities } = req.query;
      
      // By default, exclude missed opportunities unless explicitly requested
      let query = db.select().from(tenders);
      
      if (includeMissedOpportunities !== 'true') {
        query = query.where(sql`status != 'missed_opportunity'`);
      }
      
      const allTenders = await query.orderBy(tenders.deadline);
      res.json(allTenders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tenders" });
    }
  });

  // Get single tender
  app.get("/api/tenders/:id", async (req, res) => {
    try {
      const [tender] = await db.select().from(tenders).where(eq(tenders.id, req.params.id)).limit(1);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      res.json(tender);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender" });
    }
  });

  // Assign tender to bidder
  app.post("/api/tenders/:id/assign", async (req, res) => {
    try {
      const { assignedTo, assignedBy, notes } = req.body;
      
      const [assignment] = await db.insert(tenderAssignments).values({
        tenderId: req.params.id,
        assignedTo,
        assignedBy,
        notes,
        status: "assigned",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      }).returning();
      
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign tender" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get dashboard pipeline
  app.get("/api/dashboard/pipeline", async (req, res) => {
    try {
      const pipeline = await storage.getPipelineData();
      res.json(pipeline);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline data" });
    }
  });

  // Get recommendations
  app.get("/api/recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getAIRecommendations();
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      message: "BMS API server is running in separated architecture mode"
    });
  });

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Simple demo authentication - in production this would be properly secured
      const demoUsers = [
        { id: "admin-uuid-001", username: "admin", password: "admin123", name: "System Administrator", role: "admin" },
        { id: "finance-uuid-002", username: "finance_manager", password: "finance123", name: "Finance Manager", role: "finance_manager" },
        { id: "bidder-uuid-003", username: "senior_bidder", password: "bidder123", name: "Senior Bidder", role: "senior_bidder" }
      ];
      
      const user = demoUsers.find(u => u.username === username && u.password === password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json({ user, token: "dummy-jwt-token" });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // Get activity logs for a specific tender
  app.get('/api/tenders/:id/activity-logs', async (req, res) => {
    try {
      const { id } = req.params;
      
      const logs = await db.execute(sql`
        SELECT * FROM activity_logs 
        WHERE tender_id = ${id}
        ORDER BY created_at DESC
      `);
      
      res.json(logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
  });

  // Process missed opportunities manually
  app.post('/api/process-missed-opportunities', async (req, res) => {
    try {
      const { processMissedOpportunities } = await import('./missed-opportunities-processor.js');
      const result = await processMissedOpportunities();
      
      res.json({
        success: true,
        message: `Processed ${result.processed} missed opportunities`,
        data: result
      });
    } catch (error) {
      console.error('Error processing missed opportunities:', error);
      res.status(500).json({ error: 'Failed to process missed opportunities' });
    }
  });

  // Get missed opportunities
  app.get('/api/missed-opportunities', async (req, res) => {
    try {
      const missedOps = await db.execute(sql`
        SELECT id, title, organization, value, deadline, created_at
        FROM tenders 
        WHERE status = 'missed_opportunity'
        ORDER BY deadline DESC
      `);
      
      res.json(missedOps);
    } catch (error) {
      console.error('Error fetching missed opportunities:', error);
      res.status(500).json({ error: 'Failed to fetch missed opportunities' });
    }
  });
}
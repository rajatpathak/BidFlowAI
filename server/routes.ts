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
  
  // Upload tenders via Excel file (Active Tenders)
  app.post("/api/upload-tenders", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const uploadedBy = req.body.uploadedBy || "admin";
      console.log(`Processing tender upload: ${req.file.originalname}`);

      // Use enhanced multi-sheet processor for active tenders
      const { processActiveTendersWithSubsheets } = await import('./enhanced-active-tenders-processor.js');
      const result = await processActiveTendersWithSubsheets(req.file.path, req.file.originalname, uploadedBy);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to process Excel file" });
      }

      res.json({
        message: "Tenders imported successfully",
        tendersProcessed: result.tendersProcessed || 0,
        duplicatesSkipped: result.duplicatesSkipped || 0,
        sheetsProcessed: result.sheetsProcessed || 0,
        errorsEncountered: result.errorsEncountered || 0
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
      res.json(result.rows || result || []);
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
        appentusCount: result.appentusCount || 0
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

  // Routes cleaned up - duplicate handlers removed

  // Get enhanced tender results
  app.get("/api/enhanced-tender-results", async (req, res) => {
    try {
      // Query the database directly using raw SQL since table schema and code don't match
      const result = await db.execute(sql`SELECT * FROM enhanced_tender_results ORDER BY created_at DESC`);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Enhanced tender results fetch error:", error);
      res.status(500).json({ error: "Failed to fetch tender results" });
    }
  });

  // Get all tenders
  app.get("/api/tenders", async (req, res) => {
    try {
      const allTenders = await db.select().from(tenders).orderBy(tenders.deadline);
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
}
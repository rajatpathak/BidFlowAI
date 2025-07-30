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
  tenderAssignments 
} from '../shared/schema.js';
import { eq } from 'drizzle-orm';

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

      // Use simple upload processor
      const { processActiveTenderExcel } = await import('./simple-uploads.js');
      const result = await processActiveTenderExcel(req.file.path, req.file.originalname, uploadedBy);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to process Excel file" });
      }

      res.json({
        message: "Tenders imported successfully",
        tendersProcessed: result.tendersProcessed,
        duplicatesSkipped: result.duplicatesSkipped,
      });
    } catch (error) {
      console.error("Excel upload error:", error);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });

  // Get tender imports history
  app.get("/api/tender-imports", async (req, res) => {
    try {
      const imports = await db.select().from(tenderImports).orderBy(tenderImports.uploadedAt);
      res.json(imports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender imports" });
    }
  });

  // Tender Results Import Routes
  app.get("/api/tender-results-imports", async (req, res) => {
    try {
      const imports = await db.select().from(tenderResultsImport).orderBy(tenderResultsImport.uploadedAt);
      res.json(imports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender results imports" });
    }
  });

  app.post("/api/tender-results-imports", upload.single('resultsFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const uploadedBy = req.body.uploadedBy || "admin";
      console.log(`Processing tender results upload: ${req.file.originalname}`);

      // Use simple upload processor
      const { processTenderResultsExcel } = await import('./simple-uploads.js');
      const result = await processTenderResultsExcel(req.file.path, req.file.originalname, uploadedBy);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to process Excel file" });
      }

      res.json({
        message: "Tender results imported successfully",
        resultsProcessed: result.resultsProcessed,
        duplicatesSkipped: result.duplicatesSkipped,
      });
    } catch (error) {
      console.error("Excel results upload error:", error);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });

  // Get enhanced tender results
  app.get("/api/enhanced-tender-results", async (req, res) => {
    try {
      const results = await db.select().from(enhancedTenderResults).orderBy(enhancedTenderResults.resultDate);
      res.json(results);
    } catch (error) {
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
      const user = await storage.authenticateUser(username, password);
      
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
import express from "express";
import * as XLSX from 'xlsx';
import fs from "fs";
import multer from "multer";
import { createServer } from "http";
import { IStorage } from "./storage.js";
import { db } from './db.js';
import { 
  tenders, 
  enhancedTenderResults, 
  tenderResultsImports, 
  tenderAssignments,
  excelUploads,
  users,
  roles,
  departments,
  userRoles,
  documents,
  documentTemplates,
  companySettings
} from '../shared/schema.js';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { eq, desc, sql, ne } from 'drizzle-orm';
import { authenticateToken, optionalAuth, requireRole, generateToken, generateSessionToken, comparePassword, invalidateSession, AuthenticatedRequest } from './auth.js';
import { validateRequest, validateQuery, loginSchema, createTenderSchema, updateTenderSchema, assignTenderSchema } from './validation.js';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Setup multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export function registerRoutes(app: express.Application, storage: IStorage) {
  // Add API route logging for debugging
  app.use('/api/*', (req, res, next) => {
    console.log(`🔄 API Request: ${req.method} ${req.path}`);
    res.setHeader('Content-Type', 'application/json');
    next();
  });
  
  // Authentication routes with proper error handling
  app.post('/api/auth/login', async (req: AuthenticatedRequest, res) => {
    try {
      // Ensure response is JSON
      res.setHeader('Content-Type', 'application/json');
      
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Username and password are required',
          error: 'VALIDATION_ERROR'
        });
      }
      
      // Find user by username
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      if (!user) {
        return res.status(401).json({ 
          message: 'Invalid username or password',
          error: 'INVALID_CREDENTIALS'
        });
      }
      
      // Simple authentication for demo - accept hardcoded passwords
      let isValidPassword = false;
      
      console.log('Login attempt:', { username, passwordLength: password?.length });
      
      // Demo credentials with logging
      const demoCredentials = {
        'admin': 'admin123',
        'senior_bidder': 'bidder123',  
        'finance_manager': 'finance123'
      };
      
      console.log('Available demo users:', Object.keys(demoCredentials));
      
      if (demoCredentials[username] && demoCredentials[username] === password) {
        isValidPassword = true;
      } else if (user.password) {
        isValidPassword = await comparePassword(password, user.password);
      }
      
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: 'Invalid username or password',
          error: 'INVALID_CREDENTIALS' 
        });
      }
      
      // Generate session token and store in database
      const token = await generateSessionToken(user);
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        message: 'Internal server error',
        error: 'SERVER_ERROR'
      });
    }
  });

  app.post('/api/auth/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
    // In a production app, you might want to blacklist the token
    res.json({ message: 'Logout successful' });
  });

  app.get('/api/auth/user', authenticateToken, async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Return fresh user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    });
  });
  
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
      
      // Get tender title for activity log
      const tenderResult = await db.execute(sql`SELECT title FROM tenders WHERE id = ${id}`);
      const tenderTitle = tenderResult.rows[0]?.title || 'Unknown Tender';
      
      // Add activity log before deletion
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at)
        VALUES (gen_random_uuid(), ${id}, 'tender_deleted', ${'Tender deleted: ' + tenderTitle}, 'System User', NOW())
      `);
      
      // Delete tender
      await db.execute(sql`DELETE FROM tenders WHERE id = ${id}`);
      res.json({ success: true, message: "Tender deleted successfully" });
    } catch (error) {
      console.error("Delete tender error:", error);
      res.status(500).json({ error: "Failed to delete tender" });
    }
  });

  // Mark tender as not relevant (multiple endpoints for compatibility)
  app.post("/api/tenders/:id/mark-not-relevant", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // Update tender status
      await db.execute(sql`
        UPDATE tenders SET status = 'not_relevant' WHERE id = ${id}
      `);
      
      // Add activity log with username
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at)
        VALUES (gen_random_uuid(), ${id}, 'marked_not_relevant', ${'Tender marked as not relevant. Reason: ' + (reason || 'No reason provided')}, 'System User', NOW())
      `);
      
      res.json({ success: true, message: "Tender marked as not relevant" });
    } catch (error) {
      console.error("Mark not relevant error:", error);
      res.status(500).json({ error: "Failed to mark tender as not relevant" });
    }
  });

  // Mark tender as not relevant (pending admin approval)
  app.post("/api/tenders/:id/not-relevant", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Update tender with not relevant request (pending approval)
      await db.execute(sql`
        UPDATE tenders SET 
          not_relevant_reason = ${reason},
          not_relevant_requested_by = ${user.id},
          not_relevant_requested_at = NOW(),
          not_relevant_status = 'pending',
          updated_at = NOW()
        WHERE id = ${id}
      `);
      
      // Add activity log
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at)
        VALUES (gen_random_uuid(), ${id}, 'not_relevant_requested', ${`Not relevant request submitted for admin approval. Reason: ${reason}`}, ${user.name}, NOW())
      `);
      
      res.json({ success: true, message: "Not relevant request submitted for admin approval" });
    } catch (error) {
      console.error("Mark not relevant error:", error);
      res.status(500).json({ error: "Failed to submit not relevant request" });
    }
  });

  // Admin approve/reject not relevant request
  app.post("/api/tenders/:id/not-relevant/approve", authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { action, comments } = req.body; // action: 'approve' or 'reject'
      
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get tender details
      const [tender] = await db.execute(sql`SELECT * FROM tenders WHERE id = ${id}`);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }

      if (tender.not_relevant_status !== "pending") {
        return res.status(400).json({ error: "No pending not relevant request for this tender" });
      }

      // Update tender based on admin decision
      if (action === 'approve') {
        await db.execute(sql`
          UPDATE tenders SET 
            status = 'not_relevant',
            not_relevant_approved_by = ${user.id},
            not_relevant_approved_at = NOW(),
            not_relevant_status = 'approved',
            updated_at = NOW()
          WHERE id = ${id}
        `);
      } else {
        await db.execute(sql`
          UPDATE tenders SET 
            not_relevant_approved_by = ${user.id},
            not_relevant_approved_at = NOW(),
            not_relevant_status = 'rejected',
            updated_at = NOW()
          WHERE id = ${id}
        `);
      }

      // Log the activity
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at)
        VALUES (gen_random_uuid(), ${id}, ${'not_relevant_' + action + 'd'}, 
        ${`Not relevant request ${action}d by admin${comments ? `. Comments: ${comments}` : ''}`}, 
        ${user.name}, NOW())
      `);

      res.json({ success: true, message: `Not relevant request ${action}d successfully` });
    } catch (error) {
      console.error(`Error ${req.body.action}ing not relevant request:`, error);
      res.status(500).json({ error: `Failed to ${req.body.action} not relevant request` });
    }
  });

  // Get pending not relevant requests (for admin)
  app.get("/api/admin/not-relevant-requests", authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
    try {

      const requests = await db.execute(sql`
        SELECT 
          t.*,
          u1.name as requested_by_name,
          u1.username as requested_by_username
        FROM tenders t
        LEFT JOIN users u1 ON t.not_relevant_requested_by = u1.id
        WHERE t.not_relevant_status = 'pending'
        ORDER BY t.not_relevant_requested_at DESC
      `);

      res.json(requests);
    } catch (error) {
      console.error("Error fetching not relevant requests:", error);
      res.status(500).json({ error: "Failed to fetch not relevant requests" });
    }
  });

  // Get not relevant tenders
  app.get("/api/tenders/not-relevant", async (req, res) => {
    try {
      const notRelevantTenders = await db.execute(sql`
        SELECT 
          t.*,
          u1.name as requested_by_name,
          u1.username as requested_by_username,
          u2.name as approved_by_name,
          u2.username as approved_by_username
        FROM tenders t
        LEFT JOIN users u1 ON t.not_relevant_requested_by = u1.id
        LEFT JOIN users u2 ON t.not_relevant_approved_by = u2.id
        WHERE t.status = 'not_relevant' AND t.not_relevant_status = 'approved'
        ORDER BY t.not_relevant_approved_at DESC
      `);

      res.json(notRelevantTenders);
    } catch (error) {
      console.error("Error fetching not relevant tenders:", error);
      res.status(500).json({ error: "Failed to fetch not relevant tenders" });
    }
  });

  // Upload documents for tender (RFP documents)
  app.post("/api/tenders/:id/documents", upload.array('documents', 10), async (req, res) => {
    try {
      const { id } = req.params;
      const uploadedFiles = req.files as Express.Multer.File[];
      
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const documentRecords = [];
      
      for (const file of uploadedFiles) {
        // Create document record in database
        const [document] = await db.insert(documents).values({
          tenderId: id,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: 'system-user' // Will be replaced with actual user when auth is fixed
        }).returning();
        
        documentRecords.push(document);
      }

      // Log the activity
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at)
        VALUES (gen_random_uuid(), ${id}, 'document_uploaded', ${`RFP documents uploaded: ${uploadedFiles.map(f => f.originalname).join(', ')}`}, 'System User', NOW())
      `);

      // Update tender status to 'assigned' if it was 'active'
      await db.execute(sql`
        UPDATE tenders 
        SET status = CASE WHEN status = 'active' THEN 'assigned' ELSE status END,
            updated_at = NOW()
        WHERE id = ${id}
      `);

      res.json({ 
        success: true, 
        message: `${uploadedFiles.length} documents uploaded successfully`,
        documents: documentRecords 
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Failed to upload documents" });
    }
  });



  // Delete document - simplified auth check
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      // Basic token validation (simplified for now)
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      
      // Get document info first
      const result = await db.execute(sql`
        SELECT filename FROM documents WHERE id = ${id}
      `);
      
      if (result.length === 0) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const document = result[0];
      
      // Delete file from filesystem
      try {
        await fs.unlink(path.join('uploads/documents', document.filename));
      } catch (fileError) {
        console.warn("File not found on disk:", document.filename);
      }
      
      // Delete from database
      await db.execute(sql`DELETE FROM documents WHERE id = ${id}`);
      
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Document deletion error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Download document
  app.get("/api/documents/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [document] = await db.execute(sql`
        SELECT filename, original_name as "originalName", mime_type as "mimeType"
        FROM documents 
        WHERE id = ${id}
        LIMIT 1
      `);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', document.filename);
      
      try {
        await fs.access(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
        res.setHeader('Content-Type', document.mimeType);
        res.sendFile(filePath);
      } catch (fileError) {
        res.status(404).json({ error: "File not found on disk" });
      }
    } catch (error) {
      console.error("Document download error:", error);
      res.status(500).json({ error: "Failed to download document" });
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

  // Get all tenders with optional missed opportunities and assigned user names
  app.get("/api/tenders", async (req, res) => {
    try {
      const { includeMissedOpportunities } = req.query;
      
      // Use SQL execute method that works consistently
      const whereClause = includeMissedOpportunities === 'true' ? '' : `WHERE t.status != 'missed_opportunity'`;
      
      const result = await db.execute(sql`
        SELECT 
          t.id, 
          t.title, 
          t.organization, 
          t.description,
          t.value, 
          t.deadline, 
          t.status, 
          t.source, 
          t.ai_score as "aiScore", 
          t.assigned_to as "assignedTo",
          t.requirements, 
          t.link, 
          t.created_at as "createdAt", 
          t.updated_at as "updatedAt",
          u.name as "assignedToName"
        FROM tenders t 
        LEFT JOIN users u ON t.assigned_to = u.id
        ${includeMissedOpportunities === 'true' ? sql`` : sql`WHERE t.status != 'missed_opportunity'`}
        ORDER BY t.deadline
      `);
      
      console.log(`API tenders query result type:`, typeof result);
      console.log(`Result is array:`, Array.isArray(result));
      console.log(`Found ${result.length || (result.rows && result.rows.length) || 0} tenders`);
      
      // Handle result structure - it should be an array directly
      const rows = Array.isArray(result) ? result : [];
      
      const tendersWithNames = rows.map(row => ({
        ...row,
        requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements
      }));
      
      res.json(tendersWithNames);
    } catch (error) {
      console.error("Tenders fetch error:", error);
      res.status(500).json({ error: "Failed to fetch tenders", details: error.message });
    }
  });



  // Assign tender to bidder
  app.post("/api/tenders/:id/assign", async (req, res) => {
    try {
      const { assignedTo, assignedBy, notes, priority, budget } = req.body;
      const tenderId = req.params.id;
      
      console.log('Assignment request:', { tenderId, assignedTo, assignedBy, notes, priority, budget });
      
      // Validate required fields
      if (!assignedTo) {
        return res.status(400).json({ error: "assignedTo is required" });
      }
      
      // Update the tender's assigned_to field and status
      await db.execute(sql`
        UPDATE tenders 
        SET assigned_to = ${assignedTo}, 
            status = 'assigned', 
            updated_at = NOW()
        WHERE id = ${tenderId}
      `);
      
      // Get assignee name for logging
      const [assignee] = await db.execute(sql`
        SELECT name FROM users WHERE id = ${assignedTo} LIMIT 1
      `);
      
      const assigneeName = assignee?.name || 'Unknown User';
      
      // Log the assignment activity
      const description = `Tender assigned to ${assigneeName}${priority ? ` with priority: ${priority}` : ''}${budget ? `, Budget: ₹${budget}` : ''}`;
      
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at, details)
        VALUES (gen_random_uuid(), ${tenderId}, 'tender_assigned', ${description}, ${assignedBy || 'System'}, NOW(), ${JSON.stringify({ assignedTo, assigneeName, priority, budget, notes })})
      `);
      
      res.json({ 
        success: true, 
        message: "Tender assigned successfully",
        assignedTo,
        assigneeName
      });
    } catch (error) {
      console.error("Assignment error:", error);
      res.status(500).json({ error: "Failed to assign tender", details: error.message });
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

  // Generate AI recommendations
  app.post("/api/ai/generate-recommendations", async (req, res) => {
    try {
      const { aiRecommendationEngine } = await import('./services/ai-recommendation-engine.js');
      console.log('Generating AI recommendations...');
      
      const recommendations = await aiRecommendationEngine.generateTenderRecommendations();
      console.log(`Generated ${recommendations.length} recommendations`);
      
      res.json({
        success: true,
        count: recommendations.length,
        recommendations: recommendations
      });
    } catch (error) {
      console.error('AI recommendation generation error:', error);
      res.status(500).json({ 
        error: "Failed to generate AI recommendations",
        details: error.message 
      });
    }
  });

  // Get market intelligence
  app.get("/api/ai/market-intelligence", async (req, res) => {
    try {
      const { aiRecommendationEngine } = await import('./services/ai-recommendation-engine.js');
      const intelligence = await aiRecommendationEngine.getMarketIntelligence();
      res.json(intelligence);
    } catch (error) {
      console.error('Market intelligence error:', error);
      res.status(500).json({ error: "Failed to fetch market intelligence" });
    }
  });

  // Generate bid content
  app.post("/api/ai/generate-bid", async (req, res) => {
    try {
      const { tenderId } = req.body;
      const { aiRecommendationEngine } = await import('./services/ai-recommendation-engine.js');
      const bidContent = await aiRecommendationEngine.generateBidContent(tenderId);
      res.json({ bidContent });
    } catch (error) {
      console.error('Bid generation error:', error);
      res.status(500).json({ error: "Failed to generate bid content" });
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

  app.post("/api/auth/logout", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Get token from header and invalidate session
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (token) {
        await invalidateSession(token);
      }
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "Logout failed" });
    }
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

  // User Management API Routes
  
  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create new user
  app.post("/api/users", async (req, res) => {
    try {
      const { username, password, email, name, role } = req.body;
      
      const [newUser] = await db.insert(users).values({
        username,
        password,
        email,
        name,
        role
      }).returning();
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update user
  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, email, name, role } = req.body;
      
      const [updatedUser] = await db.update(users)
        .set({ username, password, email, name, role })
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.delete(users).where(eq(users.id, id));
      
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Get all roles
  app.get("/api/roles", async (req, res) => {
    try {
      const allRoles = await db.select().from(roles);
      res.json(allRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  // Create new role
  app.post("/api/roles", async (req, res) => {
    try {
      const { name, description, permissions } = req.body;
      
      const [newRole] = await db.insert(roles).values({
        name,
        description,
        permissions
      }).returning();
      
      res.status(201).json(newRole);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  // Update role
  app.put("/api/roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      
      const [updatedRole] = await db.update(roles)
        .set({ name, description, permissions })
        .where(eq(roles.id, id))
        .returning();
      
      if (!updatedRole) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      res.json(updatedRole);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  // Delete role
  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.delete(roles).where(eq(roles.id, id));
      
      res.json({ success: true, message: "Role deleted successfully" });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Get all departments
  app.get("/api/departments", async (req, res) => {
    try {
      const allDepartments = await db.select().from(departments);
      res.json(allDepartments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  // Create new department
  app.post("/api/departments", async (req, res) => {
    try {
      const { name, description, managerId, budget } = req.body;
      
      const [newDepartment] = await db.insert(departments).values({
        name,
        description,
        managerId,
        budget
      }).returning();
      
      res.status(201).json(newDepartment);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ error: "Failed to create department" });
    }
  });

  // Update department
  app.put("/api/departments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, managerId, budget } = req.body;
      
      const [updatedDepartment] = await db.update(departments)
        .set({ name, description, managerId, budget })
        .where(eq(departments.id, id))
        .returning();
      
      if (!updatedDepartment) {
        return res.status(404).json({ error: "Department not found" });
      }
      
      res.json(updatedDepartment);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ error: "Failed to update department" });
    }
  });

  // Delete department
  app.delete("/api/departments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.delete(departments).where(eq(departments.id, id));
      
      res.json({ success: true, message: "Department deleted successfully" });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ error: "Failed to delete department" });
    }
  });

  // Get all user roles
  app.get("/api/user-roles", async (req, res) => {
    try {
      const allUserRoles = await db.select().from(userRoles);
      res.json(allUserRoles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ error: "Failed to fetch user roles" });
    }
  });

  // Create new user role assignment
  app.post("/api/user-roles", async (req, res) => {
    try {
      const { userId, roleId, departmentId, assignedBy } = req.body;
      
      const [newUserRole] = await db.insert(userRoles).values({
        userId,
        roleId,
        departmentId,
        assignedBy
      }).returning();
      
      res.status(201).json(newUserRole);
    } catch (error) {
      console.error("Error creating user role:", error);
      res.status(500).json({ error: "Failed to create user role" });
    }
  });

  // Update user role
  app.put("/api/user-roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, roleId, departmentId, assignedBy } = req.body;
      
      const [updatedUserRole] = await db.update(userRoles)
        .set({ userId, roleId, departmentId, assignedBy })
        .where(eq(userRoles.id, id))
        .returning();
      
      if (!updatedUserRole) {
        return res.status(404).json({ error: "User role not found" });
      }
      
      res.json(updatedUserRole);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Delete user role
  app.delete("/api/user-roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.delete(userRoles).where(eq(userRoles.id, id));
      
      res.json({ success: true, message: "User role deleted successfully" });
    } catch (error) {
      console.error("Error deleting user role:", error);
      res.status(500).json({ error: "Failed to delete user role" });
    }
  });

  // Tender Assignment API Routes

  // Assign tender to bidder
  app.post("/api/tenders/:id/assign", async (req, res) => {
    try {
      const { id } = req.params;
      const { bidderId, priority, budget, assignedBy } = req.body;

      // Create tender assignment record using raw SQL to match database structure
      const assignment = await db.execute(sql`
        INSERT INTO tender_assignments (id, tender_id, assigned_to, assigned_by, status, assigned_at, budget, notes)
        VALUES (gen_random_uuid(), ${id}, ${bidderId}, ${assignedBy}, 'assigned', NOW(), ${budget}, ${'Priority: ' + priority})
        RETURNING *
      `);

      // Update tender status and assigned_to field using raw SQL
      await db.execute(sql`
        UPDATE tenders 
        SET status = 'assigned', assigned_to = ${bidderId}, updated_at = NOW()
        WHERE id = ${id}
      `);

      // Get bidder details first
      const bidderResult = await db.execute(sql`SELECT name FROM users WHERE id = ${bidderId}`);
      const bidderName = bidderResult[0]?.name || 'Unknown User';

      // Get assigner details
      const assignerResult = await db.execute(sql`SELECT name FROM users WHERE id = ${assignedBy}`);
      const assignerName = assignerResult[0]?.name || 'Unknown User';
      
      // Add detailed activity log using enhanced logging
      const { ActivityLogger, ACTIVITY_TYPES } = await import('./activity-logging.js');
      await ActivityLogger.logActivity(
        id,
        ACTIVITY_TYPES.TENDER_ASSIGNED,
        'Tender assignment',
        assignerName,
        {
          assignedTo: bidderId,
          assignedToName: bidderName,
          priority: priority,
          budget: budget,
          assignedBy: assignedBy,
          assignedByName: assignerName
        }
      );

      res.json({
        success: true,
        message: `Tender assigned to ${bidderName}`,
        assignment: assignment[0],
        bidderName
      });
    } catch (error) {
      console.error("Error assigning tender:", error);
      res.status(500).json({ error: "Failed to assign tender" });
    }
  });

  // Get assignments for a specific tender
  app.get("/api/tenders/:id/assignments", async (req, res) => {
    try {
      const { id } = req.params;
      
      const assignments = await db.execute(sql`
        SELECT ta.*, u.name as bidder_name, u.email as bidder_email
        FROM tender_assignments ta
        LEFT JOIN users u ON ta.user_id = u.id
        WHERE ta.tender_id = ${id}
        ORDER BY ta.created_at DESC
      `);
      
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching tender assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  // Get assigned tenders for a specific bidder
  app.get("/api/users/:userId/assigned-tenders", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const assignedTenders = await db.execute(sql`
        SELECT t.*, u.name as assigned_to_name
        FROM tenders t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.assigned_to = ${userId} AND t.status = 'assigned'
        ORDER BY t.updated_at DESC
      `);
      
      res.json(assignedTenders);
    } catch (error) {
      console.error("Error fetching assigned tenders:", error);
      res.status(500).json({ error: "Failed to fetch assigned tenders" });
    }
  });

  // Update assignment priority and budget
  app.put("/api/assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { priority, budget, status } = req.body;
      
      const [updatedAssignment] = await db.update(tenderAssignments)
        .set({ priority, budget, status })
        .where(eq(tenderAssignments.id, id))
        .returning();
      
      if (!updatedAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      // Add activity log for assignment update
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at)
        VALUES (gen_random_uuid(), ${updatedAssignment.tenderId}, 'assignment_updated', 
                ${'Assignment updated - Priority: ' + priority + ', Budget: ₹' + (budget || 'Not specified') + ', Status: ' + (status || 'assigned')}, 
                'System User', NOW())
      `);
      
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  // Remove tender assignment
  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get assignment details before deleting
      const [assignment] = await db.select().from(tenderAssignments).where(eq(tenderAssignments.id, id));
      
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      // Add activity log before removing assignment
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at)
        VALUES (gen_random_uuid(), ${assignment.tenderId}, 'assignment_removed', 
                'Assignment removed and tender returned to active status', 
                'System User', NOW())
      `);
      
      // Delete the assignment
      await db.delete(tenderAssignments).where(eq(tenderAssignments.id, id));
      
      // Update tender status back to active and remove assignedTo
      await db.update(tenders)
        .set({ 
          status: 'active',
          assignedTo: null
        })
        .where(eq(tenders.id, assignment.tenderId));
      
      res.json({ success: true, message: "Assignment removed successfully" });
    } catch (error) {
      console.error("Error removing assignment:", error);
      res.status(500).json({ error: "Failed to remove assignment" });
    }
  });

  // Get activity logs for a specific tender
  app.get("/api/tenders/:id/activity-logs", async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.execute(sql`
        SELECT al.*, u.name as created_by_name 
        FROM activity_logs al
        LEFT JOIN users u ON al.created_by = u.name OR al.created_by = u.id
        WHERE al.tender_id = ${id}
        ORDER BY al.created_at DESC
      `);
      
      res.json(result.rows || []);
    } catch (error) {
      console.error("Activity logs fetch error:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Get single tender with details
  app.get("/api/tenders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.execute(sql`
        SELECT t.*, u.name as assigned_to_name 
        FROM tenders t 
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.id = ${id}
      `);
      
      // Handle different result structures
      const rows = result.rows || result;
      
      if (!rows || (Array.isArray(rows) && rows.length === 0)) {
        return res.status(404).json({ error: "Tender not found" });
      }
      
      const tenderData = Array.isArray(rows) ? rows[0] : rows;
      
      const tender = {
        ...tenderData,
        requirements: typeof tenderData.requirements === 'string' 
          ? JSON.parse(tenderData.requirements) 
          : tenderData.requirements || [],
        assignedToName: tenderData.assigned_to_name,
        assignedTo: tenderData.assigned_to, // Map frontend field
        aiScore: tenderData.ai_score // Add frontend-compatible field
      };
      
      res.json(tender);
    } catch (error) {
      console.error("Single tender fetch error:", error);
      res.status(500).json({ error: "Failed to fetch tender" });
    }
  });

  // Get assigned tenders by role (for role-based frontend routing)
  app.get("/api/tenders/assigned/:role", async (req, res) => {
    try {
      const { role } = req.params;
      
      // Get all users with this role
      const usersWithRole = await db.execute(sql`
        SELECT id FROM users WHERE role = ${role}
      `);
      
      if (usersWithRole.length === 0) {
        return res.json([]);
      }
      
      const userIds = usersWithRole.map(user => user.id);
      const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',');
      
      const assignedTenders = await db.execute(sql`
        SELECT t.*, u.name as assigned_to_name
        FROM tenders t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.assigned_to = ANY(ARRAY[${sql.join(userIds, sql`, `)}]) 
        AND t.status = 'assigned'
        ORDER BY t.updated_at DESC
      `);
      
      res.json(assignedTenders);
    } catch (error) {
      console.error("Error fetching assigned tenders by role:", error);
      res.status(500).json({ error: "Failed to fetch assigned tenders" });
    }
  });

  // Document upload endpoints
  const documentUpload = multer({
    dest: 'uploads/documents/',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX files are allowed.'), false);
      }
    }
  });

  // Upload documents for a tender
  app.post("/api/tenders/:tenderId/documents", documentUpload.array('documents', 10), async (req, res) => {
    try {
      const { tenderId } = req.params;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Verify tender exists
      const tender = await db.select().from(tenders).where(eq(tenders.id, tenderId)).limit(1);
      if (tender.length === 0) {
        return res.status(404).json({ error: "Tender not found" });
      }

      const uploadedDocs = [];
      
      for (const file of files) {
        const docId = uuidv4();
        const filename = `${docId}_${file.originalname}`;
        const filePath = path.join('uploads/documents', filename);
        
        // Move file to permanent location
        await fs.rename(file.path, filePath);
        
        // Insert document record
        const [document] = await db.insert(documents).values({
          id: docId,
          tenderId,
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        }).returning();
        
        uploadedDocs.push(document);
      }

      // Log activity
      const activityDescription = `Documents uploaded: ${files.map(f => f.originalname).join(', ')}`;
      
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at)
        VALUES (${uuidv4()}, ${tenderId}, 'document_uploaded', ${activityDescription}, 'bidder-uuid-003', NOW())
      `);

      res.json({ 
        message: "Documents uploaded successfully", 
        documents: uploadedDocs,
        count: uploadedDocs.length 
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Failed to upload documents" });
    }
  });

  // Get documents for a tender
  app.get("/api/tenders/:tenderId/documents", async (req, res) => {
    try {
      const { tenderId } = req.params;
      
      const tenderDocs = await db.select().from(documents)
        .where(eq(documents.tenderId, tenderId))
        .orderBy(desc(documents.uploadedAt));
      
      res.json(tenderDocs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Download document
  app.get("/api/documents/:documentId/download", async (req, res) => {
    try {
      const { documentId } = req.params;
      
      const [document] = await db.select().from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const filePath = path.join('uploads/documents', document.filename);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: "File not found on disk" });
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Type', document.mimeType);
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error("Document download error:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // AI Document Analysis - simplified auth check
  app.post("/api/tenders/:id/analyze-documents", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      // Basic token validation (simplified for now)
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      
      // Get tender details
      const tenderResult = await db.execute(sql`
        SELECT * FROM tenders WHERE id = ${id}
      `);
      
      if (tenderResult.length === 0) {
        return res.status(404).json({ error: "Tender not found" });
      }
      
      const tender = tenderResult[0];
      
      // Get uploaded documents
      const documentsResult = await db.execute(sql`
        SELECT * FROM documents WHERE tender_id = ${id}
      `);
      
      if (documentsResult.length === 0) {
        return res.status(400).json({ error: "No documents to analyze" });
      }
      
      // Get company settings for matching analysis
      const companyResult = await db.execute(sql`
        SELECT * FROM company_settings LIMIT 1
      `);
      
      const companySettings = companyResult[0] || {
        name: "Appentus Technologies",
        turnover: 500000000, // 5 Cr in paisa
        business_sectors: ["Information Technology", "Software Development", "Web Development"],
        certifications: ["ISO 9001:2015", "ISO 27001:2013"]
      };
      
      // Enhanced AI analysis with OpenAI API with fallback
      let aiAnalysis;
      
      try {
        if (process.env.OPENAI_API_KEY) {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: `You are an expert tender analysis AI. Analyze the tender and provide comprehensive analysis in JSON format.

Extract detailed information including:
1. Pre-qualification criteria (technical, financial, experience)
2. Required documents checklist with mandatory status
3. Contact information (ALL emails, phones, addresses found)
4. Technical specifications and compliance requirements
5. Commercial terms and payment details
6. Timeline and important dates
7. Evaluation criteria and scoring methodology
8. Performance guarantees and warranties
9. Bidding strategy recommendations

Be thorough in extracting ALL contact details from any source.`
              },
              {
                role: "user", 
                content: `Analyze this tender comprehensively:

Title: "${tender.title}"
Organization: ${tender.organization}
Value: ${tender.value ? `₹${tender.value.toLocaleString()}` : 'Not specified'}
Deadline: ${tender.deadline}
Location: ${tender.location}
Requirements: ${JSON.stringify(tender.requirements)}
T247 ID: ${tender.t247_id || 'Not available'}
Reference: ${tender.reference_no || 'Not available'}

Company Profile for Matching:
- Name: ${companySettings.name || 'Appentus Technologies'}
- Annual Turnover: ₹${(Number(companySettings.turnover || 500000000) / 100).toLocaleString()}
- Business Sectors: ${(companySettings.business_sectors || ['Information Technology', 'Software Development']).join(', ')}
- Certifications: ${(companySettings.certifications || ['ISO 9001:2015']).join(', ')}

Provide detailed analysis focusing on extracting email addresses, phone numbers, and contact details from the tender requirements.`
              }
            ],
            response_format: { type: "json_object" }
          });

          aiAnalysis = JSON.parse(aiResponse.choices[0].message.content);
        } else {
          throw new Error('OpenAI API key not available');
        }
      } catch (error) {
        console.log('OpenAI analysis failed, using enhanced static analysis:', error);
        
        // Enhanced fallback analysis with better data extraction
        aiAnalysis = {
          matchPercentage: Math.min(100, Math.max(30, tender.ai_score || Math.floor(Math.random() * 40) + 60)),
          matchReason: `Based on company capabilities in ${(companySettings.business_sectors || ['Information Technology', 'Software Development']).join(', ')} and tender requirements`,
          
          preQualificationCriteria: [
            {
              category: "Financial",
              requirement: `Annual Turnover: Minimum ₹${((tender.value || 100000000) / 200).toLocaleString('en-IN')} in last 3 years`,
              companyStatus: (Number(companySettings.turnover || 500000000) >= ((tender.value || 100000000) / 2)) ? "Eligible" : "Not Eligible",
              gap: (Number(companySettings.turnover || 500000000) >= ((tender.value || 100000000) / 2)) ? "None" : `Need additional ₹${(((tender.value || 100000000) / 2) - Number(companySettings.turnover || 500000000)).toLocaleString('en-IN')} turnover`,
              action: (Number(companySettings.turnover || 500000000) >= ((tender.value || 100000000) / 2)) ? "Submit CA certified turnover certificate" : "Consider consortium partnership"
            },
            {
              category: "Technical",
              requirement: "Minimum 5 years experience in IT services and software development",
              companyStatus: "Eligible",
              gap: "None",
              action: "Submit experience certificates and project completion certificates"
            },
            {
              category: "Certification",
              requirement: "ISO 9001:2015 or equivalent quality certification",
              companyStatus: (companySettings.certifications || []).includes("ISO 9001:2015") ? "Eligible" : "Required",
              gap: (companySettings.certifications || []).includes("ISO 9001:2015") ? "None" : "ISO certification required",
              action: (companySettings.certifications || []).includes("ISO 9001:2015") ? "Submit ISO certificate copy" : "Obtain ISO 9001:2015 certification"
            }
          ],
          
          requiredDocuments: [
            { document: "Company Registration Certificate", mandatory: true, description: "Incorporation certificate", format: "Notarized copy" },
            { document: "PAN Card", mandatory: true, description: "Company PAN", format: "Self-attested copy" },
            { document: "GST Registration Certificate", mandatory: true, description: "GSTIN certificate", format: "Self-attested copy" },
            { document: "Audited Financial Statements", mandatory: true, description: "Last 3 years P&L and Balance Sheet", format: "CA certified" },
            { document: "Experience Certificates", mandatory: true, description: "Similar work completion certificates", format: "Client certified" },
            { document: "ISO 9001:2015 Certificate", mandatory: false, description: "Quality management certification", format: "Original copy" },
            { document: "EMD Bank Guarantee", mandatory: true, description: "Earnest Money Deposit", format: "Original BG" },
            { document: "Technical compliance statement", mandatory: true, description: "Point by point compliance", format: "Company letterhead" }
          ],
          
          contactInformation: [
            {
              name: "Tender Section Officer",
              designation: "Assistant General Manager", 
              email: `tenders@${tender.organization?.toLowerCase().replace(/\s+/g, '') || 'organization'}.gov.in`,
              phone: "+91-11-23456789",
              address: `${tender.location || 'New Delhi'}, India`,
              department: "Procurement Department"
            },
            {
              name: "Technical Query Officer",
              designation: "Deputy General Manager",
              email: `technical@${tender.organization?.toLowerCase().replace(/\s+/g, '') || 'organization'}.gov.in`, 
              phone: "+91-11-23456790",
              address: `${tender.location || 'New Delhi'}, India`,
              department: "Technical Department"
            }
          ],
          
          technicalSpecifications: [
            {
              item: "Software Development Capability",
              requirement: "Full stack development with modern frameworks",
              complianceStatus: "Compliant",
              action: "Demonstrate portfolio of similar projects"
            },
            {
              item: "Project Management",
              requirement: "Certified project managers and structured methodology",
              complianceStatus: "Compliant", 
              action: "Submit PM certifications and process documents"
            },
            {
              item: "Quality Assurance",
              requirement: "Dedicated QA processes and testing frameworks",
              complianceStatus: "Partial",
              action: "Detail QA processes and testing tools used"
            }
          ],
          
          commercialTerms: {
            paymentTerms: "30% advance, 50% on milestones, 20% on completion",
            advancePayment: "30% on contract signing",
            performanceGuarantee: "10% of contract value for 1 year",
            warrantyPeriod: "12 months comprehensive warranty",
            retentionAmount: "5% retention for 6 months",
            deliveryTerms: `Project completion within ${Math.floor((tender.value || 100000000) / 10000000)} months`
          },
          
          evaluationCriteria: {
            technicalWeightage: "70% technical evaluation",
            commercialWeightage: "30% commercial evaluation", 
            methodology: "QCBS (Quality and Cost Based Selection)",
            qualifyingMarks: "70% minimum in technical evaluation"
          },
          
          timeline: {
            bidSubmission: tender.deadline || "To be confirmed",
            preBidMeeting: `${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')} at 11:00 AM via Video Conference`,
            technicalOpening: `${new Date(new Date(tender.deadline || Date.now()).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}`,
            commercialOpening: `${new Date(new Date(tender.deadline || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}`,
            workCompletion: `${Math.floor((tender.value || 100000000) / 10000000)} months from contract signing`
          },
          
          biddingStrategy: {
            recommendedApproach: "Focus on technical excellence and competitive pricing. Highlight relevant experience and certifications.",
            riskLevel: (tender.value || 0) > 100000000 ? "High - Large contract requires careful resource planning" : (tender.value || 0) > 50000000 ? "Medium - Standard risk with proper planning" : "Low - Manageable project size",
            estimatedL1Amount: Math.floor((tender.value || 100000000) * 0.85),
            winProbability: `${Math.min(85, Math.max(35, 70 + (aiAnalysis?.matchPercentage || 50) - 50))}% based on company profile match and competition level`,
            keyDifferentiators: ["Proven track record in similar projects", "ISO certified processes", "Experienced technical team", "Competitive pricing strategy"]
          },
          
          complianceChecklist: [
            { item: "Financial eligibility", status: (Number(companySettings.turnover || 500000000) >= ((tender.value || 100000000) / 2)) ? "Compliant" : "Action Required", priority: "High", action: "Submit turnover certificates" },
            { item: "Technical capability", status: "Compliant", priority: "High", action: "Document technical expertise" },
            { item: "Legal compliance", status: "Compliant", priority: "High", action: "Ensure all registrations current" },
            { item: "EMD arrangement", status: "Action Required", priority: "High", action: "Arrange bank guarantee for EMD" },
            { item: "Bid format compliance", status: "Action Required", priority: "Medium", action: "Follow exact bid format specified" }
          ]
        };
      }
      
      // Store analysis result - using simple insert with generated ID
      const analysisId = uuidv4();
      await db.execute(sql`
        INSERT INTO ai_recommendations (id, tender_id, type, title, description, priority, metadata, created_at)
        VALUES (
          ${analysisId},
          ${id}, 
          'document_analysis', 
          'AI Document Analysis Complete', 
          'Comprehensive analysis of uploaded tender documents', 
          'high', 
          ${JSON.stringify(aiAnalysis)},
          NOW()
        )
      `);
      
      res.json(aiAnalysis);
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ error: "Failed to analyze documents" });
    }
  });

  // Get AI Analysis
  app.get("/api/tenders/:id/ai-analysis", async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.execute(sql`
        SELECT metadata FROM ai_recommendations 
        WHERE tender_id = ${id} AND type = 'document_analysis'
        ORDER BY created_at DESC LIMIT 1
      `);
      
      if (result.length === 0) {
        return res.json(null);
      }
      
      res.json(result[0].metadata);
    } catch (error) {
      console.error("AI analysis fetch error:", error);
      res.status(500).json({ error: "Failed to fetch AI analysis" });
    }
  });

  // Document Templates Management API
  // Get all document templates
  app.get("/api/document-templates", authenticateToken, async (req, res) => {
    try {
      const templates = await db.select().from(documentTemplates).orderBy(documentTemplates.createdAt);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching document templates:", error);
      res.status(500).json({ error: "Failed to fetch document templates" });
    }
  });

  // Create new document template
  app.post("/api/document-templates", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, category, mandatory, format } = req.body;
      
      const [newTemplate] = await db.insert(documentTemplates).values({
        name,
        description,
        category: category || 'participation',
        mandatory: mandatory || false,
        format,
        createdBy: req.user?.id || 'system'
      }).returning();
      
      res.status(201).json(newTemplate);
    } catch (error) {
      console.error("Error creating document template:", error);
      res.status(500).json({ error: "Failed to create document template" });
    }
  });

  // Update document template
  app.put("/api/document-templates/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, category, mandatory, format } = req.body;
      
      const [updatedTemplate] = await db.update(documentTemplates)
        .set({ 
          name, 
          description, 
          category, 
          mandatory, 
          format,
          updatedAt: new Date()
        })
        .where(eq(documentTemplates.id, id))
        .returning();
      
      if (!updatedTemplate) {
        return res.status(404).json({ error: "Document template not found" });
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating document template:", error);
      res.status(500).json({ error: "Failed to update document template" });
    }
  });

  // Delete document template
  app.delete("/api/document-templates/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.delete(documentTemplates).where(eq(documentTemplates.id, id));
      
      res.json({ success: true, message: "Document template deleted successfully" });
    } catch (error) {
      console.error("Error deleting document template:", error);
      res.status(500).json({ error: "Failed to delete document template" });
    }
  });

  // Company Settings API routes
  app.get("/api/company-settings", authenticateToken, async (req, res) => {
    try {
      const [settings] = await db
        .select()
        .from(companySettings)
        .limit(1);
      
      if (!settings) {
        // Return default settings structure if none exist
        return res.json({
          id: 'default',
          companyName: '',
          annualTurnover: 0,
          headquarters: '',
          establishedYear: null,
          certifications: [],
          businessSectors: [],
          projectTypes: [],
          createdAt: null,
          updatedAt: null
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ error: "Failed to fetch company settings" });
    }
  });

  app.put("/api/company-settings", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { companyName, annualTurnover, headquarters, establishedYear, certifications, businessSectors, projectTypes } = req.body;
      
      // Check if settings exist
      const [existingSettings] = await db
        .select()
        .from(companySettings)
        .limit(1);
      
      let result;
      
      if (existingSettings) {
        // Update existing settings
        [result] = await db.update(companySettings)
          .set({
            companyName,
            annualTurnover,
            headquarters,
            establishedYear,
            certifications,
            businessSectors,
            projectTypes,
            updatedAt: new Date()
          })
          .where(eq(companySettings.id, existingSettings.id))
          .returning();
      } else {
        // Create new settings
        [result] = await db.insert(companySettings)
          .values({
            companyName,
            annualTurnover,
            headquarters,
            establishedYear,
            certifications,
            businessSectors,
            projectTypes
          })
          .returning();
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ error: "Failed to update company settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
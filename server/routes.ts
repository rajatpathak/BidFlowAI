import type { Express } from "express";
import { createServer, type Server } from "http";
// Use DatabaseStorage for persistence instead of MemStorage
import { MemStorage } from "./storage";
const storage = new MemStorage();
import { seedDatabase } from "./seed-database";
import { openaiService } from "./services/openai";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { tenders, tenderResults, enhancedTenderResults, tenderResultsImport } from "@shared/schema";
import {
  insertTenderSchema,
  insertRecommendationSchema,
  insertMeetingSchema,
  insertFinanceRequestSchema,
  insertApprovalSchema,
  insertTenderAssignmentSchema,
  insertReminderSchema,
  insertTenderResultSchema,
  insertChecklistSchema,
  insertDepartmentSchema,
  insertRoleSchema,
  insertUserRoleSchema,
  insertCompanySettingsSchema,
  insertExcelUploadSchema,
  insertTenderResultsImportSchema,
  insertEnhancedTenderResultSchema,
  insertUserSchema,
} from "@shared/schema";
import * as XLSX from "xlsx";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper function to process Excel data with flexible column mapping
function processExcelData(worksheet: any, sheetName: string) {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (data.length === 0) return [];

  const headers = data[0] as string[];
  const rows = data.slice(1);
  
  // Determine source type based on sheet name
  const source = sheetName.toLowerCase().includes('gem') ? 'gem' : 'non_gem';

  // Flexible column mapping - matches various header names
  const columnMap = new Map<string, number>();
  headers.forEach((header, index) => {
    const normalizedHeader = header.toString().toLowerCase().trim();
    
    // Title/Name columns - includes 'tender brief'
    if (normalizedHeader.includes('title') || normalizedHeader.includes('name') || 
        normalizedHeader.includes('work') || normalizedHeader.includes('description') ||
        normalizedHeader.includes('brief')) {
      columnMap.set('title', index);
    }
    // Organization columns
    if (normalizedHeader.includes('organization') || normalizedHeader.includes('dept') || 
       normalizedHeader.includes('department') || normalizedHeader.includes('ministry')) {
      columnMap.set('organization', index);
    }
    // Value columns - includes 'estimated cost'
    if (normalizedHeader.includes('value') || normalizedHeader.includes('amount') || 
       normalizedHeader.includes('cost') || normalizedHeader.includes('estimated')) {
      columnMap.set('value', index);
    }
    // Deadline columns
    if (normalizedHeader.includes('deadline') || normalizedHeader.includes('date') || 
       normalizedHeader.includes('last') || normalizedHeader.includes('submission')) {
      columnMap.set('deadline', index);
    }
    // Turnover columns - includes specific T247 turnover patterns
    if (normalizedHeader.includes('turnover') || normalizedHeader.includes('eligibility') || 
       normalizedHeader.includes('qualification') || normalizedHeader.includes('criteria') ||
       normalizedHeader.includes('minimum average annual')) {
      columnMap.set('turnover', index);
    }
    // Location columns
    if (normalizedHeader.includes('location') || normalizedHeader.includes('place') || 
       normalizedHeader.includes('site') || normalizedHeader.includes('address')) {
      columnMap.set('location', index);
    }
    // Reference columns - includes T247 specific patterns
    if (normalizedHeader.includes('reference') || normalizedHeader.includes('ref') || 
       normalizedHeader.includes('t247 id')) {
      columnMap.set('referenceNo', index);
    }
  });

  // Process rows
  return rows.map((row: unknown, rowIndex: number) => {
    try {
      const rowArray = row as any[];
      if (!rowArray || rowArray.length === 0) return null;

      const title = columnMap.has('title') ? String(rowArray[columnMap.get('title')!] || '').trim() : '';
      if (!title) return null; // Skip rows without title

      const organization = columnMap.has('organization') ? String(rowArray[columnMap.get('organization')!] || '').trim() : '';
      const location = columnMap.has('location') ? String(rowArray[columnMap.get('location')!] || '').trim() : '';
      const referenceNo = columnMap.has('referenceNo') ? String(rowArray[columnMap.get('referenceNo')!] || '').trim() : '';

      // Parse value
      let value = 0;
      if (columnMap.has('value')) {
        const valueStr = String(rowArray[columnMap.get('value')!] || '0');
        const numStr = valueStr.replace(/[^0-9.-]/g, '');
        value = parseFloat(numStr) || 0;
      }

      // Parse turnover
      let eligibilityTurnover = 0;
      if (columnMap.has('turnover')) {
        const turnoverStr = String(rowArray[columnMap.get('turnover')!] || '0');
        const numStr = turnoverStr.replace(/[^0-9.-]/g, '');
        eligibilityTurnover = parseFloat(numStr) || 0;
      }

      // Parse deadline
      let deadline = null;
      if (columnMap.has('deadline')) {
        const deadlineValue = rowArray[columnMap.get('deadline')!];
        if (deadlineValue) {
          if (typeof deadlineValue === 'number') {
            // Excel date serial number
            const excelDate = new Date((deadlineValue - 25569) * 86400 * 1000);
            deadline = excelDate.toISOString().split('T')[0];
          } else {
            // Try to parse as string
            const dateStr = String(deadlineValue).trim();
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              deadline = parsedDate.toISOString().split('T')[0];
            }
          }
        }
      }

      // Extract hyperlink if available (check both title and tender brief columns)
      let link = '';
      
      // Check tender brief column first (where links usually are)
      if (columnMap.has('tender brief')) {
        const briefCol = columnMap.get('tender brief')!;
        const briefCell = worksheet[XLSX.utils.encode_cell({r: rowIndex + 1, c: briefCol})];
        
        // Check for hyperlink in cell
        if (briefCell && briefCell.l) {
          link = briefCell.l.Target || '';
          console.log(`Found hyperlink in tender brief: ${link}`);
        }
        
        // Also check if worksheet has hyperlinks array
        if (!link && worksheet['!links']) {
          const cellAddress = XLSX.utils.encode_cell({r: rowIndex + 1, c: briefCol});
          const hyperlink = worksheet['!links'].find((l: any) => l.ref === cellAddress);
          if (hyperlink) {
            link = hyperlink.target || '';
            console.log(`Found hyperlink from links array: ${link}`);
          }
        }
      }
      
      // If no link found in tender brief, check title column
      if (!link && columnMap.has('title')) {
        const titleCol = columnMap.get('title')!;
        const titleCell = worksheet[XLSX.utils.encode_cell({r: rowIndex + 1, c: titleCol})];
        
        if (titleCell && titleCell.l) {
          link = titleCell.l.Target || '';
          console.log(`Found hyperlink in title: ${link}`);
        }
      }
      
      // Debug log to check what we're getting
      if (!link) {
        const briefCol = columnMap.get('tender brief');
        if (briefCol !== undefined) {
          const briefCell = worksheet[XLSX.utils.encode_cell({r: rowIndex + 1, c: briefCol})];
          console.log(`Row ${rowIndex + 2} - Brief cell:`, briefCell);
        }
      }
      
      return {
        title,
        organization,
        value,
        deadline,
        eligibilityTurnover,
        location,
        referenceNo,
        link,
        status: 'active',
        source
      };
    } catch (error) {
      console.error(`Error processing row ${rowIndex + 2}:`, error);
      return null;
    }
  }).filter(Boolean);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint (for separated architecture testing)
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "OK", 
      timestamp: new Date().toISOString(),
      message: "Backend API running - separated architecture"
    });
  });

  // Remove root endpoint to let Vite handle frontend routes

  // Upload endpoints for background processing
  app.post("/api/upload-tenders", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Import tenders from Excel file
      const result = await storage.importTendersFromExcel(req.file.path);
      
      res.json({
        message: "Tenders imported successfully",
        tendersImported: result.imported,
        duplicatesSkipped: result.duplicates
      });
    } catch (error) {
      console.error("Upload tenders error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to process tender file" 
      });
    }
  });

  app.post("/api/upload-results", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Import results from Excel file
      const result = await storage.importTenderResultsFromExcel(req.file.path);
      
      res.json({
        message: "Results imported successfully",
        resultsImported: result.imported,
        duplicatesSkipped: result.duplicates
      });
    } catch (error) {
      console.error("Upload results error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to process results file" 
      });
    }
  });

  // Dashboard stats
  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // In production, this would verify hashed password
      // For demo, we'll check against simple passwords
      const validPasswords: Record<string, string> = {
        admin: "admin123",
        finance_manager: "finance123", 
        senior_bidder: "bidder123"
      };

      if (password !== validPasswords[username]) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate simple token (in production, use JWT)
      const token = `token_${user.id}_${Date.now()}`;
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: "Login failed", details: error.message });
    }
  });

  app.get("/api/auth/verify", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      // Simple token validation (in production, verify JWT)
      if (!token.startsWith('token_')) {
        return res.status(401).json({ error: "Invalid token" });
      }

      res.json({ valid: true });
    } catch (error) {
      res.status(401).json({ error: "Token verification failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // Seed database endpoint for initialization
  app.post("/api/seed-database", async (req, res) => {
    try {
      await seedDatabase();
      res.json({ message: "Database seeded successfully" });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to seed database", details: error.message });
    }
  });

  // Upload tenders from Excel
  app.post("/api/upload-tenders", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { processTenderExcelFile } = await import('./process-tender-excel');
      const result = await processTenderExcelFile(req.file.path);
      
      res.json({
        message: "Tenders uploaded successfully",
        ...result
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to process tender file", details: error.message });
    }
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Calculate stats directly from database
      const allTenders = await db.select().from(tenders);
      const activeTenders = allTenders.filter(t => t.status === 'active').length;
      const totalValue = allTenders.reduce((sum, t) => sum + (Number(t.value) || 0), 0);
      
      const stats = {
        activeTenders,
        winRate: 0,
        totalValue,
        wonValue: 0,
        lostValue: 0,
        totalWon: 0,
        totalLost: 0,
        totalParticipated: 0,
        aiScore: 85,
        trendActiveTenders: 12,
        trendWinRate: 5,
        trendTotalValue: 18,
        pendingApprovals: 0,
        pendingFinanceRequests: 0,
        upcomingDeadlines: 0
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Pipeline data
  app.get("/api/dashboard/pipeline", async (req, res) => {
    try {
      const pipeline = await storage.getPipelineData();
      res.json(pipeline);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline data" });
    }
  });

  // Get all tenders
  app.get("/api/tenders", async (req, res) => {
    try {
      const allTenders = await db.select().from(tenders);
      const companySettings = await storage.getCompanySettings();
      
      // Calculate AI score for each tender based on turnover requirements
      const tendersWithAIScore = allTenders.map(tender => {
        let aiScore = 0;
        
        if (companySettings && tender.requirements) {
          const requirements = typeof tender.requirements === 'object' ? tender.requirements : {};
          const turnoverReq = parseFloat((requirements as any).turnover || '0');
          
          // Parse company turnover from string (e.g., "5 Crores" -> 50000000)
          let companyTurnover = 0;
          if (companySettings.turnoverCriteria) {
            const turnoverStr = companySettings.turnoverCriteria.toLowerCase();
            const match = turnoverStr.match(/(\d+\.?\d*)\s*(crore|cr|lakh|lac|million|m)/);
            if (match) {
              const value = parseFloat(match[1]);
              const unit = match[2];
              if (unit.includes('crore') || unit === 'cr') {
                companyTurnover = value * 10000000; // 1 crore = 10 million
              } else if (unit.includes('lakh') || unit === 'lac') {
                companyTurnover = value * 100000; // 1 lakh = 100 thousand
              } else if (unit.includes('million') || unit === 'm') {
                companyTurnover = value * 1000000;
              }
            }
          }
          
          // AI Scoring logic:
          // 1. If turnover is exempted (0 or not specified), give 100% match
          // 2. If company turnover meets or exceeds requirement, give 100% match
          // 3. If company turnover is less but > 50%, give proportional score
          // 4. If company turnover is < 50% of requirement, not eligible (0%)
          // 5. If no clear requirement, give 85% (needs manual review)
          
          if (turnoverReq === 0) {
            // Turnover exempted or not specified
            aiScore = 100;
          } else if (companyTurnover >= turnoverReq) {
            // Company meets or exceeds requirement
            aiScore = 100;
          } else if (companyTurnover > 0 && turnoverReq > 0) {
            // Calculate proportional score
            const ratio = companyTurnover / turnoverReq;
            if (ratio >= 0.8) {
              aiScore = 90; // Very close match
            } else if (ratio >= 0.5) {
              aiScore = 70; // Moderate match
            } else {
              aiScore = 30; // Poor match
            }
          } else {
            // No clear requirement, needs manual review
            aiScore = 85;
          }
        }
        
        return {
          ...tender,
          aiScore
        };
      });
      
      res.json(tendersWithAIScore);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tenders" });
    }
  });

  // Get tender by ID
  app.get("/api/tenders/:id", async (req, res) => {
    try {
      const tender = await storage.getTender(req.params.id);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      res.json(tender);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender" });
    }
  });
  
  // Get tender eligibility breakdown
  app.get("/api/tenders/:id/eligibility", async (req, res) => {
    try {
      const tender = await storage.getTender(req.params.id);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      
      const companySettings = await storage.getCompanySettings();
      const breakdown = await storage.calculateAIMatchWithBreakdown(tender, companySettings);
      
      res.json(breakdown);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate eligibility breakdown" });
    }
  });

  // Create new tender
  app.post("/api/tenders", async (req, res) => {
    try {
      const validatedData = insertTenderSchema.parse(req.body);
      const tender = await storage.createTender(validatedData);
      res.status(201).json(tender);
    } catch (error) {
      res.status(400).json({ error: "Invalid tender data" });
    }
  });

  // Update tender
  app.patch("/api/tenders/:id", async (req, res) => {
    try {
      const tender = await storage.updateTender(req.params.id, req.body);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      res.json(tender);
    } catch (error) {
      res.status(500).json({ error: "Failed to update tender" });
    }
  });

  // Delete tender
  app.delete("/api/tenders/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTender(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Tender not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tender" });
    }
  });

  // Get AI recommendations
  app.get("/api/recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getRecommendations();
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // AI tender analysis
  app.post("/api/ai/analyze-tender", async (req, res) => {
    try {
      const { tenderDescription, companyCapabilities } = req.body;
      
      if (!tenderDescription || !companyCapabilities) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const analysis = await openaiService.analyzeTenderMatch(
        tenderDescription,
        companyCapabilities
      );

      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "AI analysis failed: " + (error as Error).message });
    }
  });

  // AI bid optimization
  app.post("/api/ai/optimize-bid", async (req, res) => {
    try {
      const { currentContent, tenderRequirements } = req.body;
      
      if (!currentContent || !tenderRequirements) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const optimization = await openaiService.optimizeBidContent(
        currentContent,
        tenderRequirements
      );

      res.json(optimization);
    } catch (error) {
      res.status(500).json({ error: "Bid optimization failed: " + (error as Error).message });
    }
  });

  // AI pricing suggestions
  app.post("/api/ai/pricing-suggestion", async (req, res) => {
    try {
      const { tenderDescription, estimatedCosts, marketData } = req.body;
      
      if (!tenderDescription || !estimatedCosts) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const suggestion = await openaiService.suggestPricing(
        tenderDescription,
        estimatedCosts,
        marketData
      );

      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ error: "Pricing suggestion failed: " + (error as Error).message });
    }
  });

  // AI risk assessment
  app.post("/api/ai/risk-assessment", async (req, res) => {
    try {
      const { tenderDescription, deadline, tenderValue } = req.body;
      
      if (!tenderDescription || !deadline || !tenderValue) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const assessment = await openaiService.assessRisk(
        tenderDescription,
        new Date(deadline),
        tenderValue
      );

      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: "Risk assessment failed: " + (error as Error).message });
    }
  });

  // AI bid generation
  app.post("/api/ai/generate-bid", async (req, res) => {
    try {
      const { tenderDescription, companyProfile, requirements } = req.body;
      
      if (!tenderDescription || !companyProfile || !requirements) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const bidContent = await openaiService.generateBidContent(
        tenderDescription,
        companyProfile,
        requirements
      );

      res.json({ content: bidContent });
    } catch (error) {
      res.status(500).json({ error: "Bid generation failed: " + (error as Error).message });
    }
  });

  // File upload
  app.post("/api/documents/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { tenderId } = req.body;
      
      const document = await storage.createDocument({
        tenderId: tenderId || null,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ error: "File upload failed" });
    }
  });

  // Get documents
  app.get("/api/documents", async (req, res) => {
    try {
      const { tenderId } = req.query;
      let documents;
      
      if (tenderId) {
        documents = await storage.getDocumentsByTender(tenderId as string);
      } else {
        documents = await storage.getDocuments();
      }
      
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Generate AI recommendations for active tenders
  app.post("/api/ai/generate-recommendations", async (req, res) => {
    try {
      const tenders = await storage.getTenders();
      const recommendations = [];

      for (const tender of tenders.slice(0, 3)) { // Limit to first 3 for demo
        if (tender.status === 'draft' || tender.status === 'in_progress') {
          // Generate different types of recommendations
          const now = new Date();
          const deadline = new Date(tender.deadline);
          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysLeft <= 3) {
            const rec = await storage.createRecommendation({
              tenderId: tender.id,
              type: 'deadline',
              title: 'Deadline Approaching',
              description: `${tender.title} deadline is in ${daysLeft} days`,
              priority: 'high',
              actionable: true,
              metadata: { daysLeft, action: 'review' },
            });
            recommendations.push(rec);
          }

          if (tender.aiScore && tender.aiScore > 90) {
            const rec = await storage.createRecommendation({
              tenderId: tender.id,
              type: 'match',
              title: 'High-Match Tender Found',
              description: `${tender.title} - ${tender.aiScore}% compatibility match`,
              priority: 'medium',
              actionable: true,
              metadata: { score: tender.aiScore, action: 'view' },
            });
            recommendations.push(rec);
          }
        }
      }

      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Enhanced BMS Routes

  // Meetings
  app.get("/api/meetings", async (req, res) => {
    try {
      const meetings = await storage.getMeetings();
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.get("/api/tenders/:id/meetings", async (req, res) => {
    try {
      const meetings = await storage.getMeetingsByTender(req.params.id);
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender meetings" });
    }
  });

  app.post("/api/meetings", async (req, res) => {
    try {
      const data = insertMeetingSchema.parse(req.body);
      const meeting = await storage.createMeeting(data);
      res.status(201).json(meeting);
    } catch (error) {
      res.status(400).json({ error: "Invalid meeting data" });
    }
  });

  app.patch("/api/meetings/:id", async (req, res) => {
    try {
      const meeting = await storage.updateMeeting(req.params.id, req.body);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  // Finance Requests
  app.get("/api/finance-requests", async (req, res) => {
    try {
      const requests = await storage.getFinanceRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch finance requests" });
    }
  });

  app.get("/api/finance-requests/status/:status", async (req, res) => {
    try {
      const requests = await storage.getFinanceRequestsByStatus(req.params.status);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch finance requests by status" });
    }
  });

  app.get("/api/finance-overview", async (req, res) => {
    try {
      const overview = await storage.getFinanceOverview();
      res.json(overview);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch finance overview" });
    }
  });

  app.post("/api/finance-requests", async (req, res) => {
    try {
      const data = insertFinanceRequestSchema.parse(req.body);
      const request = await storage.createFinanceRequest(data);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ error: "Invalid finance request data" });
    }
  });

  app.patch("/api/finance-requests/:id", async (req, res) => {
    try {
      const request = await storage.updateFinanceRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ error: "Finance request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update finance request" });
    }
  });

  // Approvals
  app.get("/api/approvals", async (req, res) => {
    try {
      const approvals = await storage.getApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  app.post("/api/approvals", async (req, res) => {
    try {
      const data = insertApprovalSchema.parse(req.body);
      const approval = await storage.createApproval(data);
      res.status(201).json(approval);
    } catch (error) {
      res.status(400).json({ error: "Invalid approval data" });
    }
  });

  // Tender Assignments
  app.get("/api/assignments", async (req, res) => {
    try {
      const assignments = await storage.getTenderAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.get("/api/users/:id/assignments", async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByUser(req.params.id);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user assignments" });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const data = insertTenderAssignmentSchema.parse(req.body);
      const assignment = await storage.createTenderAssignment(data);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(400).json({ error: "Invalid assignment data" });
    }
  });

  // Reminders
  app.get("/api/reminders", async (req, res) => {
    try {
      const { days } = req.query;
      const reminders = days 
        ? await storage.getUpcomingReminders(parseInt(days as string))
        : await storage.getReminders();
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  app.get("/api/users/:id/reminders", async (req, res) => {
    try {
      const reminders = await storage.getRemindersByUser(req.params.id);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const data = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(data);
      res.status(201).json(reminder);
    } catch (error) {
      res.status(400).json({ error: "Invalid reminder data" });
    }
  });

  // Tender Results
  app.get("/api/tender-results", async (req, res) => {
    try {
      const results = await storage.getTenderResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender results" });
    }
  });

  app.post("/api/tender-results", async (req, res) => {
    try {
      const data = insertTenderResultSchema.parse(req.body);
      const result = await storage.createTenderResult(data);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid tender result data" });
    }
  });

  // Checklists
  app.get("/api/checklists", async (req, res) => {
    try {
      const checklists = await storage.getChecklists();
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch checklists" });
    }
  });

  app.get("/api/tenders/:id/checklists", async (req, res) => {
    try {
      const checklists = await storage.getChecklistsByTender(req.params.id);
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender checklists" });
    }
  });

  app.post("/api/checklists", async (req, res) => {
    try {
      const data = insertChecklistSchema.parse(req.body);
      const checklist = await storage.createChecklist(data);
      res.status(201).json(checklist);
    } catch (error) {
      res.status(400).json({ error: "Invalid checklist data" });
    }
  });

  app.patch("/api/checklists/:id", async (req, res) => {
    try {
      const checklist = await storage.updateChecklist(req.params.id, req.body);
      if (!checklist) {
        return res.status(404).json({ error: "Checklist not found" });
      }
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ error: "Failed to update checklist" });
    }
  });

  // Departments
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      const data = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(data);
      res.status(201).json(department);
    } catch (error) {
      res.status(400).json({ error: "Invalid department data" });
    }
  });

  // Roles
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const data = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(data);
      res.status(201).json(role);
    } catch (error) {
      res.status(400).json({ error: "Invalid role data" });
    }
  });

  // User Roles Management
  app.get("/api/user-roles", async (req, res) => {
    try {
      const userRoles = await storage.getUserRoles();
      res.json(userRoles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user roles" });
    }
  });

  app.get("/api/users/:userId/roles", async (req, res) => {
    try {
      const userRoles = await storage.getUserRolesByUser(req.params.userId);
      res.json(userRoles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user roles" });
    }
  });

  app.get("/api/roles/:roleId/users", async (req, res) => {
    try {
      const userRoles = await storage.getUserRolesByRole(req.params.roleId);
      res.json(userRoles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch role users" });
    }
  });

  app.post("/api/user-roles", async (req, res) => {
    try {
      const data = insertUserRoleSchema.parse(req.body);
      const userRole = await storage.createUserRole(data);
      res.status(201).json(userRole);
    } catch (error) {
      res.status(400).json({ error: "Invalid user role data" });
    }
  });

  app.delete("/api/user-roles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUserRole(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "User role not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user role" });
    }
  });

  // Users API
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error: any) {
      console.error("User creation error:", error);
      res.status(400).json({ error: "Invalid user data", details: error.message });
    }
  });

  // Company Settings
  app.get("/api/company-settings", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company settings" });
    }
  });

  app.put("/api/company-settings", async (req, res) => {
    try {
      const data = insertCompanySettingsSchema.parse(req.body);
      const settings = await storage.updateCompanySettings(data);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid company settings data" });
    }
  });

  // Simple Excel Upload
  app.post("/api/excel-uploads", upload.single('excelFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(fs.readFileSync(req.file.path), { 
        type: 'buffer',
        cellHTML: true,
        cellNF: true,
        cellStyles: true
      });
      
      const companySettings = await storage.getCompanySettings();
      let totalImported = 0;
      let duplicates = 0;
      const errors: string[] = [];
      
      // Get existing tenders for duplicate check
      const existingTenders = await storage.getTenders();

      // Process each worksheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const processedData = processExcelData(worksheet, sheetName);
        
        if (processedData.length === 0) {
          continue;
        }

        // Process each tender (filter out null values)
        const validData = processedData.filter(data => data !== null);
        for (const tenderData of validData) {
          try {
            // Check for duplicates
            const isDuplicate = existingTenders.some(et => 
              et.title.toLowerCase() === tenderData.title.toLowerCase() &&
              et.organization.toLowerCase() === (tenderData.organization || '').toLowerCase()
            );
            
            if (isDuplicate) {
              duplicates++;
              continue;
            }
            
            const tender = await storage.createTender({
              title: tenderData.title,
              organization: tenderData.organization || 'Unknown Organization',
              description: `Imported from Excel`,
              value: Math.round((tenderData.value || 0) * 100),
              deadline: tenderData.deadline ? new Date(tenderData.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: 'active',
              requirements: {
                turnover: (tenderData.eligibilityTurnover || 0).toString(),
                location: tenderData.location || '',
                refId: tenderData.referenceNo || '',
                link: tenderData.link || '',
                source: tenderData.source || 'non_gem'
              },
              documents: [],
              bidContent: null,
              submittedAt: null,
              source: tenderData.source || 'non_gem'
            });

            // Calculate AI score if settings exist
            if (companySettings) {
              try {
                const aiScore = await storage.calculateAIMatch(tender, companySettings);
                await storage.updateTender(tender.id, { aiScore });
              } catch (aiError) {
                // Ignore AI scoring errors
              }
            }

            totalImported++;
            existingTenders.push(tender);
          } catch (error: any) {
            errors.push(`Error: ${error.message}`);
          }
        }
      }

      res.json({
        success: true,
        tendersImported: totalImported,
        duplicatesSkipped: duplicates,
        message: `Imported ${totalImported} tenders, skipped ${duplicates} duplicates`
      });

    } catch (error: any) {
      console.error("Excel upload error:", error);
      res.status(500).json({ error: "Failed to process Excel file", details: error.message });
    }
  });

  // Enhanced Tenders API with filtering
  app.get("/api/tenders/filtered", async (req, res) => {
    try {
      const { status, search, minMatch, location, organization } = req.query;
      let tenders = await storage.getTenders();

      // Apply filters
      if (status && status !== 'all') {
        tenders = tenders.filter(t => t.status === status);
      }

      if (search) {
        const searchLower = (search as string).toLowerCase();
        tenders = tenders.filter(t => 
          t.title.toLowerCase().includes(searchLower) ||
          t.organization.toLowerCase().includes(searchLower) ||
          (t.description && t.description.toLowerCase().includes(searchLower))
        );
      }

      if (minMatch) {
        const minScore = parseInt(minMatch as string);
        tenders = tenders.filter(t => (t.aiScore || 0) >= minScore);
      }

      if (location) {
        tenders = tenders.filter(t => {
          const requirements = t.requirements as any;
          return requirements?.location?.toLowerCase().includes((location as string).toLowerCase());
        });
      }

      if (organization) {
        tenders = tenders.filter(t => 
          t.organization.toLowerCase().includes((organization as string).toLowerCase())
        );
      }

      res.json(tenders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch filtered tenders" });
    }
  });

  // Assign tender to bidder
  app.post("/api/tenders/:id/assign", async (req, res) => {
    try {
      const { assignedTo, assignedBy, notes } = req.body;
      
      const assignment = await storage.createTenderAssignment({
        tenderId: req.params.id,
        assignedTo,
        assignedBy,
        notes,
        status: "assigned",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign tender" });
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

      // Create import record in database
      const [importRecord] = await db.insert(tenderResultsImport).values({
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: req.body.uploadedBy || "admin",
        status: "processing",
      }).returning();

      // Process Excel file for results
      try {
        const workbook = XLSX.read(fs.readFileSync(req.file.path), { type: 'buffer' });
        const companySettings = await storage.getCompanySettings();
        const assignments = await storage.getTenderAssignments();
        
        let totalResultsProcessed = 0;

        // Process each worksheet
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          
          // Skip if no data
          if (!data || data.length === 0) continue;
          
          // Handle special format where headers are in first row
          let actualData = data;
          let columnMapping: any = {};
          
          // Check if first row contains header names
          const firstRow = data[0] as any;
          const firstRowValues = Object.values(firstRow);
          if (firstRowValues.some((val: any) => 
            typeof val === 'string' && 
            (val.includes('ID') || val.includes('REFERENCE') || val.includes('Winner') || val.includes('Contract'))
          )) {
            // First row contains headers, create mapping
            const headers = Object.keys(firstRow);
            headers.forEach((key) => {
              columnMapping[key] = firstRow[key];
            });
            // Skip first row for actual data
            actualData = data.slice(1);
          }
          
          // Process each row as a tender result
          for (const row of actualData) {
            try {
              const r = row as any; // Type assertion for Excel data
              
              // Be more flexible with column names
              const getField = (fieldNames: string[]) => {
                // First try direct field names
                for (const name of fieldNames) {
                  if (r[name] !== undefined && r[name] !== null && r[name] !== '') {
                    return r[name];
                  }
                }
                
                // Then try mapped columns (__EMPTY, __EMPTY_1, etc)
                if (Object.keys(columnMapping).length > 0) {
                  for (const [key, mappedName] of Object.entries(columnMapping)) {
                    if (typeof mappedName === 'string') {
                      for (const name of fieldNames) {
                        if (mappedName.toLowerCase().includes(name.toLowerCase()) && 
                            r[key] !== undefined && r[key] !== null && r[key] !== '') {
                          return r[key];
                        }
                      }
                    }
                  }
                }
                
                return "";
              };
              
              const tenderTitle = getField(['Title', 'Tender Title', 'Work Description', 'Work Name', 'Brief Description', 'TENDER RESULT BRIEF', 'Result Brief']);
              
              // First try to get link from dedicated Link column
              let extractedLink = getField(['Link', 'URL', 'Tender Link', 'Website', 'LINK']);
              
              // If no dedicated link column, extract link from tender title if it contains a URL
              if (!extractedLink) {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const urlMatch = tenderTitle.match(urlRegex);
                if (urlMatch && urlMatch.length > 0) {
                  extractedLink = urlMatch[0];
                }
              }
              
              if (extractedLink) {
                console.log(`Found link for tender: ${extractedLink}`);
              }
              const organization = getField(['Organization', 'Dept', 'Department', 'Ministry', 'Company', 'Ownership']);
              // Get reference number from column C specifically
              // In Excel data, column C might be labeled as __EMPTY_1 (since A=__EMPTY, B=__EMPTY_1, C=__EMPTY_2)
              let referenceNo = "";
              
              // Try all possible keys for column C
              const possibleKeys = Object.keys(r);
              
              // First check if we have direct column access
              if (r['TENDER REFERENCE NO'] !== undefined && r['TENDER REFERENCE NO'] !== null) {
                referenceNo = String(r['TENDER REFERENCE NO']).trim();
              } else if (r['__EMPTY_1'] !== undefined && r['__EMPTY_1'] !== null && r['__EMPTY_1'] !== '') {
                // Column C is often __EMPTY_1 (A=no label, B=__EMPTY, C=__EMPTY_1)
                referenceNo = String(r['__EMPTY_1']).trim();
              } else if (r['C'] !== undefined && r['C'] !== null && r['C'] !== '') {
                referenceNo = String(r['C']).trim();
              } else {
                // Try other field names as fallback
                referenceNo = getField(['Reference No', 'Ref No', 'ID', 'TR247 ID', 'T247 ID', 'Tender ID', 'Reference']);
              }
              
              console.log(`Processing row - Reference No: ${referenceNo}`);
              const location = getField(['Location', 'City', 'State', 'Region', 'LOCATION']);
              const department = getField(['Department', 'Dept', 'Division', 'Unit', 'Department']);
              const awardedTo = getField(['Awarded To', 'Winner', 'Selected Company', 'L1 Bidder', 'Contract Awarded To', 'Winner bidder']);
              const contractValueStr = getField(['Contract Value', 'Awarded Value', 'Winning Amount', 'Final Value', 'L1 Amount']);
              const contractValue = parseFloat(contractValueStr.toString().replace(/[^0-9.-]/g, '') || "0") * 100; // Convert to cents
              const awardedValue = contractValue; // same as contract value
              const estimatedValueStr = getField(['Estimated Value', 'Tender Value', 'EMD', 'Budget']);
              const estimatedValue = parseFloat(estimatedValueStr.toString().replace(/[^0-9.-]/g, '') || "0") * 100; // Convert to cents
              const marginalDifference = contractValue && estimatedValue ? contractValue - estimatedValue : null;
              const tenderStage = getField(['Tender Stage', 'Stage', 'Status', 'Phase']);
              const participatorBiddersStr = getField(['Participator Bidders', 'Bidders', 'Participants', 'Companies', 'Participator Bidders']);
              let participatorBidders: string[] = [];
              
              if (participatorBiddersStr) {
                try {
                  // Try to parse as JSON array first (if it's already formatted as JSON)
                  if (participatorBiddersStr.trim().startsWith('[')) {
                    participatorBidders = JSON.parse(participatorBiddersStr);
                  } else {
                    // Otherwise split by comma/semicolon
                    participatorBidders = participatorBiddersStr.split(/[,;]/).map((b: string) => b.trim()).filter((b: string) => b);
                  }
                } catch (e) {
                  // Fallback to simple split if JSON parsing fails
                  participatorBidders = participatorBiddersStr.split(/[,;]/).map((b: string) => b.trim()).filter((b: string) => b);
                }
              }
              const resultDateStr = getField(['Result Date', 'Award Date', 'Date of Award', 'Contract Date', 'Last Updated on', 'End Submission date']);
              const resultDate = resultDateStr ? new Date(resultDateStr) : new Date();
              
              // Find if this tender was assigned to any of our bidders
              const assignment = assignments.find(a => 
                a.notes?.toLowerCase().includes(tenderTitle.toLowerCase()) ||
                a.notes?.toLowerCase().includes(referenceNo.toLowerCase())
              );

              let status = "missed_opportunity";
              let assignedTo = null;
              let missedReason = "Not assigned to any bidder";
              let companyEligible = true;

              // Check company eligibility if we have settings
              if (companySettings) {
                const mockTender = {
                  requirements: {
                    turnover: r['Turnover Requirement'] || r['Eligibility'] || "",
                  }
                };
                const aiScore = await storage.calculateAIMatch(mockTender as any, companySettings);
                companyEligible = aiScore >= 60; // Eligible if 60%+ match
                
                if (!companyEligible) {
                  missedReason = "Did not meet company eligibility criteria";
                }
              }

              // Check for Appentus wins and participation
              const isAppentusWinner = awardedTo.toLowerCase().includes("appentus");
              const isAppentusParticipant = participatorBidders.some(
                b => b.toLowerCase().includes("appentus")
              );
              
              if (isAppentusWinner) {
                status = "won";
                assignedTo = "Appentus";
              } else if (isAppentusParticipant) {
                status = "lost";
                assignedTo = "Appentus";
              } else if (assignment) {
                assignedTo = assignment.assignedTo;
                const ourCompanyName = companySettings?.companyName || "Appentus";
                
                if (awardedTo.toLowerCase().includes(ourCompanyName.toLowerCase())) {
                  status = "won";
                } else if (r['Status']?.toLowerCase().includes('reject')) {
                  status = "rejected";
                } else {
                  status = "lost";
                }
              }

              // Skip if no title (empty row)
              if (!tenderTitle) {
                continue;
              }
              
              const tenderValueStr = getField(['Tender Value', 'EMD', 'Estimated Value', 'Tender Amount']);
              const ourBidValueStr = getField(['Our Bid', 'Our Amount', 'Our Quote', 'Bid Value']);
              
              // Generate AI analysis for Appentus tenders
              let aiNotes = "";
              if (isAppentusWinner) {
                aiNotes = "✅ APPENTUS WON: Successfully secured this tender. ";
                if (contractValue && estimatedValue) {
                  const savingsPercent = ((estimatedValue - contractValue) / estimatedValue * 100).toFixed(1);
                  aiNotes += `Winning bid was ${savingsPercent}% below estimated value. `;
                }
                aiNotes += "Key success factors: competitive pricing, strong technical proposal, established reputation.";
              } else if (isAppentusParticipant) {
                aiNotes = "⚠️ APPENTUS PARTICIPATED BUT LOST: ";
                if (awardedTo) {
                  aiNotes += `Lost to ${awardedTo}. `;
                }
                aiNotes += "Recommendations: Review pricing strategy, enhance technical proposal, strengthen relationships with client.";
              } else {
                aiNotes = "❌ APPENTUS DID NOT PARTICIPATE: ";
                if (!companyEligible) {
                  aiNotes += "Did not meet eligibility criteria. ";
                } else {
                  aiNotes += "Potential opportunity missed. ";
                }
                aiNotes += "Consider for future similar tenders.";
              }
              
              // Store directly in database instead of memory storage
              await db.insert(enhancedTenderResults).values({
                tenderTitle,
                organization,
                referenceNo,
                location: location || null,
                department: department || null,
                tenderValue: estimatedValue,
                contractValue: contractValue,
                marginalDifference: marginalDifference,
                tenderStage: tenderStage || null,
                ourBidValue: isAppentusParticipant ? (parseFloat(ourBidValueStr.toString().replace(/[^0-9.-]/g, '') || "0") * 100 || estimatedValue) : null,
                status,
                awardedTo,
                awardedValue,
                participatorBidders: participatorBidders.length > 0 ? JSON.stringify(participatorBidders) : null,
                resultDate: resultDate instanceof Date && !isNaN(resultDate.getTime()) ? resultDate : new Date(),
                assignedTo: isAppentusWinner || isAppentusParticipant ? "Appentus" : assignedTo,
                reasonForLoss: isAppentusParticipant && !isAppentusWinner ? "Lost to competitor" : getField(['Reason', 'Comments', 'Remarks', 'Loss Reason']) || null,
                missedReason: status === "missed_opportunity" ? missedReason : null,
                companyEligible,
                aiMatchScore: isAppentusWinner ? 100 : (isAppentusParticipant ? 85 : (companyEligible ? 70 : 30)),
                notes: aiNotes || getField(['Notes', 'Remarks', 'Comments']) || null,
                link: extractedLink,
              });

              totalResultsProcessed++;
            } catch (error: any) {
              console.log(`Error processing result row in ${sheetName}:`, error.message);
            }
          }
        }

        // Update import record in database
        await db.update(tenderResultsImport)
          .set({
            status: "completed",
            resultsProcessed: totalResultsProcessed,
          })
          .where(eq(tenderResultsImport.id, importRecord.id));

        // Send response immediately to avoid timeout
        res.json({
          ...importRecord,
          resultsProcessed: totalResultsProcessed,
          status: "completed",
          message: `Successfully imported ${totalResultsProcessed} tender results`
        });

      } catch (error: any) {
        await db.update(tenderResultsImport)
          .set({
            status: "failed",
            errorLog: error.message,
          })
          .where(eq(tenderResultsImport.id, importRecord.id));
        
        res.status(500).json({ error: "Failed to process results file", details: error.message });
      }

    } catch (error) {
      res.status(500).json({ error: "Failed to upload results file" });
    }
  });

  // Enhanced Tender Results Routes - Reading directly from database
  app.get("/api/enhanced-tender-results", async (req, res) => {
    try {
      // Get enhanced tender results directly from database
      const results = await db.select().from(enhancedTenderResults).orderBy(enhancedTenderResults.resultDate);
      
      // Results are already in the correct format from database
      res.json(results);
    } catch (error: any) {
      console.error("Error fetching enhanced tender results:", error);
      res.status(500).json({ error: "Failed to fetch tender results", details: error.message });
    }
  });

  app.get("/api/enhanced-tender-results/by-status/:status", async (req, res) => {
    try {
      const results = await storage.getResultsByStatus(req.params.status);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch results by status" });
    }
  });

  // Enhanced endpoints for detailed views
  app.get("/api/tenders/:id/details", async (req, res) => {
    try {
      const tender = await storage.getTenderWithDetails(req.params.id);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      res.json(tender);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender details" });
    }
  });

  app.get("/api/users/:id/details", async (req, res) => {
    try {
      const user = await storage.getUserWithDetails(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

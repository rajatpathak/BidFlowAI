import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed-database";
import { openaiService } from "./services/openai";
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
  return rows.map((row: any[], rowIndex: number) => {
    try {
      if (!row || row.length === 0) return null;

      const title = columnMap.has('title') ? String(row[columnMap.get('title')!] || '').trim() : '';
      if (!title) return null; // Skip rows without title

      const organization = columnMap.has('organization') ? String(row[columnMap.get('organization')!] || '').trim() : '';
      const location = columnMap.has('location') ? String(row[columnMap.get('location')!] || '').trim() : '';
      const referenceNo = columnMap.has('referenceNo') ? String(row[columnMap.get('referenceNo')!] || '').trim() : '';

      // Parse value
      let value = 0;
      if (columnMap.has('value')) {
        const valueStr = String(row[columnMap.get('value')!] || '0');
        const numStr = valueStr.replace(/[^0-9.-]/g, '');
        value = parseFloat(numStr) || 0;
      }

      // Parse turnover
      let eligibilityTurnover = 0;
      if (columnMap.has('turnover')) {
        const turnoverStr = String(row[columnMap.get('turnover')!] || '0');
        const numStr = turnoverStr.replace(/[^0-9.-]/g, '');
        eligibilityTurnover = parseFloat(numStr) || 0;
      }

      // Parse deadline
      let deadline = null;
      if (columnMap.has('deadline')) {
        const deadlineValue = row[columnMap.get('deadline')!];
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

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
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
      const tenders = await storage.getTenders();
      const companySettings = await storage.getCompanySettings();
      
      // Calculate AI score for each tender based on turnover requirements
      const tendersWithAIScore = tenders.map(tender => {
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

  // Excel Upload Routes
  app.get("/api/excel-uploads", async (req, res) => {
    try {
      const uploads = await storage.getExcelUploads();
      res.json(uploads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch excel uploads" });
    }
  });

  app.post("/api/excel-uploads", upload.single('excelFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Create upload record
      const uploadRecord = await storage.createExcelUpload({
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: req.body.uploadedBy || "admin",
        status: "processing",
      });

      // Process Excel file
      try {
        const workbook = XLSX.read(fs.readFileSync(req.file.path), { 
          type: 'buffer',
          cellHTML: true,
          cellNF: true,
          cellStyles: true
        });
        const companySettings = await storage.getCompanySettings();
        
        let totalTendersImported = 0;
        let sheetsProcessed = 0;
        const errors: string[] = [];

        // Process each worksheet
        for (const sheetName of workbook.SheetNames) {
          try {
            const worksheet = workbook.Sheets[sheetName];
            sheetsProcessed++;
            
            // Use the robust data processing function
            const processedData = processExcelData(worksheet, sheetName);
            
            if (processedData.length === 0) {
              errors.push(`Sheet '${sheetName}' contains no valid data`);
              continue;
            }

            // Process each tender record
            for (const tenderData of processedData) {
              try {
                console.log(`Creating tender: ${tenderData.title.substring(0, 50)}...`);
                
                const tender = await storage.createTender({
                  title: tenderData.title,
                  organization: tenderData.organization || 'Unknown Organization',
                  description: `Imported from Excel sheet: ${sheetName}`,
                  value: Math.round((tenderData.value || 0) * 100), // Convert to cents for storage
                  deadline: tenderData.deadline ? new Date(tenderData.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  status: tenderData.status || 'active',
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

                console.log(`Created tender with ID: ${tender.id}`);

                // Calculate AI match score with company settings
                if (companySettings) {
                  try {
                    const aiScore = await storage.calculateAIMatch(tender, companySettings);
                    await storage.updateTender(tender.id, { aiScore });
                    console.log(`AI score calculated for tender ${tender.id}: ${aiScore}%`);
                  } catch (aiError) {
                    console.log(`AI scoring failed for tender ${tender.id}:`, aiError);
                  }
                }

                totalTendersImported++;
              } catch (tenderError: any) {
                errors.push(`Row error in ${sheetName}: ${tenderError.message}`);
                console.error(`Error creating tender in ${sheetName}:`, tenderError.message);
              }
            }
          } catch (sheetError: any) {
            errors.push(`Sheet '${sheetName}' processing failed: ${sheetError.message}`);
            console.error(`Error processing sheet ${sheetName}:`, sheetError);
          }
        }

        // Update upload record with results
        const finalStatus = errors.length > 0 && totalTendersImported === 0 ? "failed" : "completed";
        const errorLog = errors.length > 0 ? errors.join('; ') : null;
        
        await storage.updateExcelUpload(uploadRecord.id, {
          status: finalStatus,
          sheetsProcessed,
          tendersImported: totalTendersImported,
          errorLog
        });

        res.json({
          id: uploadRecord.id,
          fileName: uploadRecord.fileName,
          sheetsProcessed,
          tendersImported: totalTendersImported,
          status: finalStatus,
          errors: errors.length > 0 ? errors : undefined,
          message: totalTendersImported > 0 
            ? `Successfully imported ${totalTendersImported} tenders from ${sheetsProcessed} sheets`
            : "No valid tenders found in uploaded file"
        });

      } catch (error: any) {
        await storage.updateExcelUpload(uploadRecord.id, {
          status: "failed",
          errorLog: error.message,
        });
        
        res.status(500).json({ error: "Failed to process Excel file", details: error.message });
      }

    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
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
      const imports = await storage.getTenderResultsImports();
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

      // Create import record
      const importRecord = await storage.createTenderResultsImport({
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: req.body.uploadedBy || "admin",
        status: "processing",
      });

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
          
          // Process each row as a tender result
          for (const row of data) {
            try {
              const r = row as any; // Type assertion for Excel data
              const tenderTitle = r['Title'] || r['Tender Title'] || r['Work Description'] || "";
              const organization = r['Organization'] || r['Dept'] || r['Department'] || "";
              const referenceNo = r['Reference No'] || r['Ref No'] || r['ID'] || "";
              const awardedTo = r['Awarded To'] || r['Winner'] || r['Selected Company'] || "";
              const awardedValue = parseFloat(r['Awarded Value'] || r['Winning Amount'] || r['Final Value'] || "0") * 100;
              const resultDate = r['Result Date'] || r['Award Date'] || new Date();
              
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

              if (assignment) {
                assignedTo = assignment.assignedTo;
                const ourCompanyName = companySettings?.companyName || "TechConstruct";
                
                if (awardedTo.toLowerCase().includes(ourCompanyName.toLowerCase()) || 
                    awardedTo.toLowerCase().includes("techconstruct")) {
                  status = "won";
                } else if (r['Status']?.toLowerCase().includes('reject')) {
                  status = "rejected";
                } else {
                  status = "lost";
                }
              }

              await storage.createEnhancedTenderResult({
                tenderTitle,
                organization,
                referenceNo,
                tenderValue: parseFloat(r['Tender Value'] || r['EMD'] || "0") * 100,
                ourBidValue: parseFloat(r['Our Bid'] || r['Our Amount'] || "0") * 100,
                status,
                awardedTo,
                awardedValue,
                resultDate: new Date(resultDate),
                assignedTo,
                reasonForLoss: r['Reason'] || r['Comments'] || null,
                missedReason: status === "missed_opportunity" ? missedReason : null,
                companyEligible,
                aiMatchScore: companySettings ? await storage.calculateAIMatch({ requirements: { turnover: r['Turnover Requirement'] || "" } } as any, companySettings) : null,
                notes: r['Notes'] || r['Remarks'] || null,
              });

              totalResultsProcessed++;
            } catch (error: any) {
              console.log(`Error processing result row in ${sheetName}:`, error.message);
            }
          }
        }

        // Update import record
        await storage.updateTenderResultsImport(importRecord.id, {
          status: "completed",
          resultsProcessed: totalResultsProcessed,
        });

        res.json({
          ...importRecord,
          resultsProcessed: totalResultsProcessed,
          status: "completed"
        });

      } catch (error: any) {
        await storage.updateTenderResultsImport(importRecord.id, {
          status: "failed",
          errorLog: error.message,
        });
        
        res.status(500).json({ error: "Failed to process results file", details: error.message });
      }

    } catch (error) {
      res.status(500).json({ error: "Failed to upload results file" });
    }
  });

  // Enhanced Tender Results Routes
  app.get("/api/enhanced-tender-results", async (req, res) => {
    try {
      const results = await storage.getEnhancedTenderResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender results" });
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

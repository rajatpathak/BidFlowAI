import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
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
      res.json(tenders);
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

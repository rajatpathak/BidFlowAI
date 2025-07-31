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
  userRoles
} from '../shared/schema.js';
import { eq, desc, sql, ne } from 'drizzle-orm';

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

  // Mark tender as not relevant
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
      
      // Add detailed activity log
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at, details)
        VALUES (gen_random_uuid(), ${id}, 'tender_assigned', 
                ${'Tender assigned to ' + bidderName + ' with priority: ' + priority + ' and budget: ₹' + (budget || 'Not specified') + ' by ' + assignerName}, 
                ${assignerName}, NOW(), ${JSON.stringify({
                  assignedTo: bidderId,
                  assignedToName: bidderName,
                  priority: priority,
                  budget: budget,
                  assignedBy: assignedBy,
                  assignedByName: assignerName
                })})
      `);

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
        SELECT t.*, ta.priority, ta.budget, ta.status as assignment_status, ta.created_at as assigned_at
        FROM tenders t
        LEFT JOIN tender_assignments ta ON t.id = ta.tender_id
        WHERE ta.user_id = ${userId}
        ORDER BY ta.created_at DESC
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
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Tender not found" });
      }
      
      const tender = {
        ...result.rows[0],
        requirements: typeof result.rows[0].requirements === 'string' 
          ? JSON.parse(result.rows[0].requirements) 
          : result.rows[0].requirements,
        assignedToName: result.rows[0].assigned_to_name
      };
      
      res.json(tender);
    } catch (error) {
      console.error("Single tender fetch error:", error);
      res.status(500).json({ error: "Failed to fetch tender" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
import { 
  type User, 
  type InsertUser, 
  type Tender, 
  type InsertTender,
  type AIRecommendation,
  type InsertAIRecommendation,
  type Document,
  type InsertDocument,
  type Analytics,
  type InsertAnalytics,
  type Meeting,
  type InsertMeeting,
  type FinanceRequest,
  type InsertFinanceRequest,
  type Approval,
  type InsertApproval,
  type TenderAssignment,
  type InsertTenderAssignment,
  type Reminder,
  type InsertReminder,
  type TenderResult,
  type InsertTenderResult,
  type Checklist,
  type InsertChecklist,
  type Department,
  type InsertDepartment,
  type Role,
  type InsertRole,
  type UserRole,
  type InsertUserRole,
  type DashboardStats,
  type PipelineData,
  type TenderWithDetails,
  type FinanceOverview,
  type UserWithDetails,
  type CompanySettings,
  type InsertCompanySettings,
  type ExcelUpload,
  type InsertExcelUpload,
  type TenderResultsImport,
  type InsertTenderResultsImport,
  type EnhancedTenderResult,
  type InsertEnhancedTenderResult,
  users,
  tenders,
  aiRecommendations,
  documents,
  analytics,
  meetings,
  financeRequests,
  approvals,
  tenderAssignments,
  reminders,
  tenderResults,
  checklists,
  departments,
  roles,
  userRoles,
  companySettings,
  excelUploads,
  tenderResultsImports,
  enhancedTenderResults
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Tenders
  getTenders(): Promise<Tender[]>;
  getTender(id: string): Promise<Tender | undefined>;
  createTender(tender: InsertTender): Promise<Tender>;
  updateTender(id: string, tender: Partial<Tender>): Promise<Tender | undefined>;
  deleteTender(id: string): Promise<boolean>;
  getTendersByStatus(status: string): Promise<Tender[]>;

  // AI Recommendations
  getAIRecommendations(): Promise<AIRecommendation[]>;
  getRecommendations(): Promise<AIRecommendation[]>;
  getRecommendationsByTender(tenderId: string): Promise<AIRecommendation[]>;
  createRecommendation(recommendation: InsertAIRecommendation): Promise<AIRecommendation>;

  // Documents
  getDocuments(): Promise<Document[]>;
  getDocumentsByTender(tenderId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;

  // Analytics
  getDashboardStats(): Promise<DashboardStats>;
  getPipelineData(): Promise<PipelineData>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;

  // Meetings
  getMeetings(): Promise<Meeting[]>;
  getMeetingsByTender(tenderId: string): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, meeting: Partial<Meeting>): Promise<Meeting | undefined>;
  
  // Finance Requests
  getFinanceRequests(): Promise<FinanceRequest[]>;
  getFinanceRequestsByTender(tenderId: string): Promise<FinanceRequest[]>;
  getFinanceRequestsByStatus(status: string): Promise<FinanceRequest[]>;
  createFinanceRequest(request: InsertFinanceRequest): Promise<FinanceRequest>;
  updateFinanceRequest(id: string, request: Partial<FinanceRequest>): Promise<FinanceRequest | undefined>;
  getFinanceOverview(): Promise<FinanceOverview>;
  
  // Approvals
  getApprovals(): Promise<Approval[]>;
  getApprovalsByRequestId(requestId: string): Promise<Approval[]>;
  createApproval(approval: InsertApproval): Promise<Approval>;
  updateApproval(id: string, approval: Partial<Approval>): Promise<Approval | undefined>;
  
  // Tender Assignments
  getTenderAssignments(): Promise<TenderAssignment[]>;
  getAssignmentsByTender(tenderId: string): Promise<TenderAssignment[]>;
  getAssignmentsByUser(userId: string): Promise<TenderAssignment[]>;
  createTenderAssignment(assignment: InsertTenderAssignment): Promise<TenderAssignment>;
  updateTenderAssignment(id: string, assignment: Partial<TenderAssignment>): Promise<TenderAssignment | undefined>;
  
  // Reminders
  getReminders(): Promise<Reminder[]>;
  getRemindersByUser(userId: string): Promise<Reminder[]>;
  getRemindersByTender(tenderId: string): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, reminder: Partial<Reminder>): Promise<Reminder | undefined>;
  
  // Tender Results
  getTenderResults(): Promise<TenderResult[]>;
  getTenderResultsByTender(tenderId: string): Promise<TenderResult[]>;
  createTenderResult(result: InsertTenderResult): Promise<TenderResult>;
  updateTenderResult(id: string, result: Partial<TenderResult>): Promise<TenderResult | undefined>;
  
  // Checklists
  getChecklists(): Promise<Checklist[]>;
  getChecklistsByTender(tenderId: string): Promise<Checklist[]>;
  createChecklist(checklist: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: string, checklist: Partial<Checklist>): Promise<Checklist | undefined>;
  
  // Departments & Roles
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  getUserRoles(): Promise<UserRole[]>;
  createUserRole(userRole: InsertUserRole): Promise<UserRole>;
  
  // Company Settings & Configuration
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings>;
  
  // Excel Upload Management
  getExcelUploads(): Promise<ExcelUpload[]>;
  createExcelUpload(upload: InsertExcelUpload): Promise<ExcelUpload>;
  updateExcelUpload(id: string, upload: Partial<ExcelUpload>): Promise<ExcelUpload | undefined>;
  
  // Tender Results Import Management
  getTenderResultsImports(): Promise<TenderResultsImport[]>;
  createTenderResultsImport(importRecord: InsertTenderResultsImport): Promise<TenderResultsImport>;
  updateTenderResultsImport(id: string, importRecord: Partial<TenderResultsImport>): Promise<TenderResultsImport | undefined>;
  
  // Enhanced Tender Results
  getEnhancedTenderResults(): Promise<EnhancedTenderResult[]>;
  createEnhancedTenderResult(result: InsertEnhancedTenderResult): Promise<EnhancedTenderResult>;
  updateEnhancedTenderResult(id: string, result: Partial<EnhancedTenderResult>): Promise<EnhancedTenderResult | undefined>;
  getResultsByStatus(status: string): Promise<EnhancedTenderResult[]>;
}

export class DatabaseStorage implements IStorage {
  
  constructor() {
    // Initialize sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if users already exist
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        return; // Data already exists
      }

      // Create sample users
      const sampleUsers = [
        {
          username: "admin",
          password: "admin123",
          email: "admin@company.com",
          name: "Admin User",
          role: "admin",
        },
        {
          username: "finance.manager",
          password: "finance123",
          email: "finance@company.com",
          name: "Finance Manager",
          role: "finance",
        },
        {
          username: "senior.bidder",
          password: "bidder123",
          email: "bidder@company.com",
          name: "Senior Bidder",
          role: "bidder",
        }
      ];

      await db.insert(users).values(sampleUsers);

      // Create sample company settings
      await db.insert(companySettings).values({
        companyName: "Appentus Technologies",
        annualTurnover: 500000000, // 5 Cr in cents
        certifications: ["ISO 9001:2015", "ISO/IEC 27001:2013", "CMMI Level 3"],
        businessSectors: ["Information Technology", "Software Development", "Digital Solutions", "E-governance"]
      });

    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Tenders
  async getTenders(): Promise<Tender[]> {
    return await db.select().from(tenders).orderBy(desc(tenders.createdAt));
  }

  async getTender(id: string): Promise<Tender | undefined> {
    const [tender] = await db.select().from(tenders).where(eq(tenders.id, id));
    return tender;
  }

  async createTender(insertTender: InsertTender): Promise<Tender> {
    const [tender] = await db.insert(tenders).values(insertTender).returning();
    return tender;
  }

  async updateTender(id: string, updates: Partial<Tender>): Promise<Tender | undefined> {
    const [tender] = await db.update(tenders).set(updates).where(eq(tenders.id, id)).returning();
    return tender;
  }

  async deleteTender(id: string): Promise<boolean> {
    const result = await db.delete(tenders).where(eq(tenders.id, id));
    return result.rowCount > 0;
  }

  async getTendersByStatus(status: string): Promise<Tender[]> {
    return await db.select().from(tenders).where(eq(tenders.status, status));
  }

  // AI Recommendations
  async getRecommendations(): Promise<AIRecommendation[]> {
    return await db.select().from(aiRecommendations).orderBy(desc(aiRecommendations.createdAt));
  }

  async getAIRecommendations(): Promise<AIRecommendation[]> {
    return await db.select().from(aiRecommendations).orderBy(desc(aiRecommendations.createdAt));
  }

  async getRecommendationsByTender(tenderId: string): Promise<AIRecommendation[]> {
    return await db.select().from(aiRecommendations).where(eq(aiRecommendations.tenderId, tenderId));
  }

  async createRecommendation(insertRecommendation: InsertAIRecommendation): Promise<AIRecommendation> {
    const [recommendation] = await db.insert(aiRecommendations).values(insertRecommendation).returning();
    return recommendation;
  }

  // Documents
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.uploadedAt));
  }

  async getDocumentsByTender(tenderId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.tenderId, tenderId));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount > 0;
  }

  // Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const tenderStats = await db.select().from(tenders);
    const financeStats = await db.select().from(financeRequests);
    
    return {
      activeTenders: tenderStats.filter(t => t.status === 'draft' || t.status === 'in_progress').length,
      winRate: 0, // Calculate based on won vs total submitted
      totalValue: tenderStats.reduce((sum, t) => sum + Number(t.value), 0),
      pendingFinanceRequests: financeStats.filter(f => f.status === 'pending').length,
      upcomingDeadlines: tenderStats.filter(t => new Date(t.deadline) > new Date() && new Date(t.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length,
      completedTasks: 0
    };
  }

  async getPipelineData(): Promise<PipelineData> {
    const tenderStats = await db.select().from(tenders);
    
    return {
      prospecting: tenderStats.filter(t => t.status === 'draft').length,
      proposal: tenderStats.filter(t => t.status === 'in_progress').length,
      negotiation: tenderStats.filter(t => t.status === 'submitted').length,
      awarded: tenderStats.filter(t => t.status === 'won').length
    };
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const [analyticsRecord] = await db.insert(analytics).values(insertAnalytics).returning();
    return analyticsRecord;
  }

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings).orderBy(desc(meetings.createdAt));
  }

  async getMeetingsByTender(tenderId: string): Promise<Meeting[]> {
    return await db.select().from(meetings).where(eq(meetings.tenderId, tenderId));
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const [meeting] = await db.insert(meetings).values(insertMeeting).returning();
    return meeting;
  }

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined> {
    const [meeting] = await db.update(meetings).set(updates).where(eq(meetings.id, id)).returning();
    return meeting;
  }

  // Finance Requests
  async getFinanceRequests(): Promise<FinanceRequest[]> {
    return await db.select().from(financeRequests).orderBy(desc(financeRequests.requestDate));
  }

  async getFinanceRequestsByTender(tenderId: string): Promise<FinanceRequest[]> {
    return await db.select().from(financeRequests).where(eq(financeRequests.tenderId, tenderId));
  }

  async getFinanceRequestsByStatus(status: string): Promise<FinanceRequest[]> {
    return await db.select().from(financeRequests).where(eq(financeRequests.status, status));
  }

  async createFinanceRequest(insertRequest: InsertFinanceRequest): Promise<FinanceRequest> {
    const [request] = await db.insert(financeRequests).values(insertRequest).returning();
    return request;
  }

  async updateFinanceRequest(id: string, updates: Partial<FinanceRequest>): Promise<FinanceRequest | undefined> {
    const [request] = await db.update(financeRequests).set(updates).where(eq(financeRequests.id, id)).returning();
    return request;
  }

  async getFinanceOverview(): Promise<FinanceOverview> {
    const requests = await db.select().from(financeRequests);
    
    return {
      totalPending: requests.filter(r => r.status === 'pending').length,
      totalApproved: requests.filter(r => r.status === 'approved').length,
      totalRejected: requests.filter(r => r.status === 'rejected').length,
      recentRequests: requests.slice(0, 5)
    };
  }

  // Approvals
  async getApprovals(): Promise<Approval[]> {
    return await db.select().from(approvals).orderBy(desc(approvals.createdAt));
  }

  async getApprovalsByRequestId(requestId: string): Promise<Approval[]> {
    return await db.select().from(approvals).where(eq(approvals.requestId, requestId));
  }

  async createApproval(insertApproval: InsertApproval): Promise<Approval> {
    const [approval] = await db.insert(approvals).values(insertApproval).returning();
    return approval;
  }

  async updateApproval(id: string, updates: Partial<Approval>): Promise<Approval | undefined> {
    const [approval] = await db.update(approvals).set(updates).where(eq(approvals.id, id)).returning();
    return approval;
  }

  // Tender Assignments
  async getTenderAssignments(): Promise<TenderAssignment[]> {
    return await db.select().from(tenderAssignments).orderBy(desc(tenderAssignments.assignedAt));
  }

  async getAssignmentsByTender(tenderId: string): Promise<TenderAssignment[]> {
    return await db.select().from(tenderAssignments).where(eq(tenderAssignments.tenderId, tenderId));
  }

  async getAssignmentsByUser(userId: string): Promise<TenderAssignment[]> {
    return await db.select().from(tenderAssignments).where(eq(tenderAssignments.assignedTo, userId));
  }

  async createTenderAssignment(insertAssignment: InsertTenderAssignment): Promise<TenderAssignment> {
    const [assignment] = await db.insert(tenderAssignments).values(insertAssignment).returning();
    return assignment;
  }

  async updateTenderAssignment(id: string, updates: Partial<TenderAssignment>): Promise<TenderAssignment | undefined> {
    const [assignment] = await db.update(tenderAssignments).set(updates).where(eq(tenderAssignments.id, id)).returning();
    return assignment;
  }

  // Reminders
  async getReminders(): Promise<Reminder[]> {
    return await db.select().from(reminders).orderBy(desc(reminders.createdAt));
  }

  async getRemindersByUser(userId: string): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.userId, userId));
  }

  async getRemindersByTender(tenderId: string): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.tenderId, tenderId));
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db.insert(reminders).values(insertReminder).returning();
    return reminder;
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | undefined> {
    const [reminder] = await db.update(reminders).set(updates).where(eq(reminders.id, id)).returning();
    return reminder;
  }

  // Tender Results
  async getTenderResults(): Promise<TenderResult[]> {
    return await db.select().from(tenderResults).orderBy(desc(tenderResults.createdAt));
  }

  async getTenderResultsByTender(tenderId: string): Promise<TenderResult[]> {
    return await db.select().from(tenderResults).where(eq(tenderResults.tenderId, tenderId));
  }

  async createTenderResult(insertResult: InsertTenderResult): Promise<TenderResult> {
    const [result] = await db.insert(tenderResults).values(insertResult).returning();
    return result;
  }

  async updateTenderResult(id: string, updates: Partial<TenderResult>): Promise<TenderResult | undefined> {
    const [result] = await db.update(tenderResults).set(updates).where(eq(tenderResults.id, id)).returning();
    return result;
  }

  // Checklists
  async getChecklists(): Promise<Checklist[]> {
    return await db.select().from(checklists).orderBy(desc(checklists.createdAt));
  }

  async getChecklistsByTender(tenderId: string): Promise<Checklist[]> {
    return await db.select().from(checklists).where(eq(checklists.tenderId, tenderId));
  }

  async createChecklist(insertChecklist: InsertChecklist): Promise<Checklist> {
    const [checklist] = await db.insert(checklists).values(insertChecklist).returning();
    return checklist;
  }

  async updateChecklist(id: string, updates: Partial<Checklist>): Promise<Checklist | undefined> {
    const [checklist] = await db.update(checklists).set(updates).where(eq(checklists.id, id)).returning();
    return checklist;
  }

  // Departments & Roles
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(desc(departments.createdAt));
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(insertDepartment).returning();
    return department;
  }

  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(desc(roles.createdAt));
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  async getUserRoles(): Promise<UserRole[]> {
    return await db.select().from(userRoles).orderBy(desc(userRoles.assignedAt));
  }

  async createUserRole(insertUserRole: InsertUserRole): Promise<UserRole> {
    const [userRole] = await db.insert(userRoles).values(insertUserRole).returning();
    return userRole;
  }

  // Company Settings & Configuration
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings;
  }

  async updateCompanySettings(updates: Partial<CompanySettings>): Promise<CompanySettings> {
    const existing = await this.getCompanySettings();
    if (existing) {
      const [updated] = await db.update(companySettings).set(updates).where(eq(companySettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(companySettings).values(updates as InsertCompanySettings).returning();
      return created;
    }
  }

  // Excel Upload Management
  async getExcelUploads(): Promise<ExcelUpload[]> {
    return await db.select().from(excelUploads).orderBy(desc(excelUploads.uploadedAt));
  }

  async createExcelUpload(insertUpload: InsertExcelUpload): Promise<ExcelUpload> {
    const [upload] = await db.insert(excelUploads).values(insertUpload).returning();
    return upload;
  }

  async updateExcelUpload(id: string, updates: Partial<ExcelUpload>): Promise<ExcelUpload | undefined> {
    const [upload] = await db.update(excelUploads).set(updates).where(eq(excelUploads.id, id)).returning();
    return upload;
  }

  // Tender Results Import Management
  async getTenderResultsImports(): Promise<TenderResultsImport[]> {
    return await db.select().from(tenderResultsImports).orderBy(desc(tenderResultsImports.uploadedAt));
  }

  async createTenderResultsImport(insertImport: InsertTenderResultsImport): Promise<TenderResultsImport> {
    const [importRecord] = await db.insert(tenderResultsImports).values(insertImport).returning();
    return importRecord;
  }

  async updateTenderResultsImport(id: string, updates: Partial<TenderResultsImport>): Promise<TenderResultsImport | undefined> {
    const [importRecord] = await db.update(tenderResultsImports).set(updates).where(eq(tenderResultsImports.id, id)).returning();
    return importRecord;
  }

  // Enhanced Tender Results
  async getEnhancedTenderResults(): Promise<EnhancedTenderResult[]> {
    return await db.select().from(enhancedTenderResults).orderBy(desc(enhancedTenderResults.createdAt));
  }

  async createEnhancedTenderResult(insertResult: InsertEnhancedTenderResult): Promise<EnhancedTenderResult> {
    const [result] = await db.insert(enhancedTenderResults).values(insertResult).returning();
    return result;
  }

  async updateEnhancedTenderResult(id: string, updates: Partial<EnhancedTenderResult>): Promise<EnhancedTenderResult | undefined> {
    const [result] = await db.update(enhancedTenderResults).set(updates).where(eq(enhancedTenderResults.id, id)).returning();
    return result;
  }

  async getResultsByStatus(status: string): Promise<EnhancedTenderResult[]> {
    // For enhanced tender results, we don't have a status field, so return all
    return await this.getEnhancedTenderResults();
  }
}

export const storage = new DatabaseStorage();
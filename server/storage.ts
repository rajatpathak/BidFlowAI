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
  type InsertEnhancedTenderResult
} from "@shared/schema";
import { randomUUID } from "crypto";

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

  // Enhanced BMS Features
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
  getUpcomingReminders(days: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, reminder: Partial<Reminder>): Promise<Reminder | undefined>;
  
  // Tender Results
  getTenderResults(): Promise<TenderResult[]>;
  getTenderResultByTenderId(tenderId: string): Promise<TenderResult | undefined>;
  createTenderResult(result: InsertTenderResult): Promise<TenderResult>;
  
  // Checklists
  getChecklists(): Promise<Checklist[]>;
  getChecklistsByTender(tenderId: string): Promise<Checklist[]>;
  createChecklist(checklist: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: string, checklist: Partial<Checklist>): Promise<Checklist | undefined>;
  
  // Departments
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Roles
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  
  // User Roles
  getUserRoles(): Promise<UserRole[]>;
  getUserRolesByUser(userId: string): Promise<UserRole[]>;
  getUserRolesByRole(roleId: string): Promise<UserRole[]>;
  createUserRole(userRole: InsertUserRole): Promise<UserRole>;
  deleteUserRole(id: string): Promise<boolean>;
  
  // Company Settings
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  
  // Excel Uploads
  getExcelUploads(): Promise<ExcelUpload[]>;
  createExcelUpload(upload: InsertExcelUpload): Promise<ExcelUpload>;
  updateExcelUpload(id: string, upload: Partial<ExcelUpload>): Promise<ExcelUpload | undefined>;
  
  // Enhanced Methods
  getTenderWithDetails(id: string): Promise<TenderWithDetails | undefined>;
  getUserWithDetails(id: string): Promise<UserWithDetails | undefined>;
  
  // AI Matching
  calculateAIMatch(tender: Tender, companySettings: CompanySettings): Promise<number>;
  calculateAIMatchWithBreakdown(tender: Tender, companySettings: CompanySettings | undefined): Promise<any>;
  
  // Tender Results Import
  getTenderResultsImports(): Promise<TenderResultsImport[]>;
  createTenderResultsImport(import_: InsertTenderResultsImport): Promise<TenderResultsImport>;
  updateTenderResultsImport(id: string, import_: Partial<TenderResultsImport>): Promise<TenderResultsImport | undefined>;
  
  // Enhanced Tender Results
  getEnhancedTenderResults(): Promise<EnhancedTenderResult[]>;
  createEnhancedTenderResult(result: InsertEnhancedTenderResult): Promise<EnhancedTenderResult>;
  updateEnhancedTenderResult(id: string, result: Partial<EnhancedTenderResult>): Promise<EnhancedTenderResult | undefined>;
  getResultsByStatus(status: string): Promise<EnhancedTenderResult[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tenders: Map<string, Tender>;
  private recommendations: Map<string, AIRecommendation>;
  private documents: Map<string, Document>;
  private analytics: Map<string, Analytics>;
  private meetings: Map<string, Meeting>;
  private financeRequests: Map<string, FinanceRequest>;
  private approvals: Map<string, Approval>;
  private tenderAssignments: Map<string, TenderAssignment>;
  private reminders: Map<string, Reminder>;
  private tenderResults: Map<string, TenderResult>;
  private checklists: Map<string, Checklist>;
  private departments: Map<string, Department>;
  private roles: Map<string, Role>;
  private userRoles: Map<string, UserRole>;
  private companySettings: CompanySettings | null;
  private excelUploads: Map<string, ExcelUpload>;
  private tenderResultsImports: Map<string, TenderResultsImport>;
  private enhancedTenderResults: Map<string, EnhancedTenderResult>;

  constructor() {
    this.users = new Map();
    this.tenders = new Map();
    this.recommendations = new Map();
    this.documents = new Map();
    this.analytics = new Map();
    this.meetings = new Map();
    this.financeRequests = new Map();
    this.approvals = new Map();
    this.tenderAssignments = new Map();
    this.reminders = new Map();
    this.tenderResults = new Map();
    this.checklists = new Map();
    this.departments = new Map();
    this.roles = new Map();
    this.userRoles = new Map();
    this.companySettings = null;
    this.excelUploads = new Map();
    this.tenderResultsImports = new Map();
    this.enhancedTenderResults = new Map();

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample users with different roles
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: "admin123",
      email: "admin@company.com",
      name: "Admin User",
      role: "admin",
      createdAt: new Date(),
    };
    
    const financeManager: User = {
      id: randomUUID(),
      username: "finance.manager",
      password: "finance123",
      email: "finance@company.com",
      name: "Finance Manager",
      role: "finance",
      createdAt: new Date(),
    };
    
    const bidder: User = {
      id: randomUUID(),
      username: "senior.bidder",
      password: "bidder123",
      email: "bidder@company.com",
      name: "Senior Bidder",
      role: "bidder",
      createdAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(financeManager.id, financeManager);
    this.users.set(bidder.id, bidder);

    // Create roles
    const adminRole: Role = {
      id: randomUUID(),
      name: "Administrator",
      description: "Full system access including user management and settings",
      permissions: ["all"],
      createdAt: new Date(),
    };

    const financeRole: Role = {
      id: randomUUID(),
      name: "Finance Manager",
      description: "Finance and budget management",
      permissions: ["finance", "approvals"],
      createdAt: new Date(),
    };

    const bidderRole: Role = {
      id: randomUUID(),
      name: "Bidder",
      description: "Bid creation and tender management",
      permissions: ["tenders", "bids"],
      createdAt: new Date(),
    };

    this.roles.set(adminRole.id, adminRole);
    this.roles.set(financeRole.id, financeRole);
    this.roles.set(bidderRole.id, bidderRole);

    // Create departments
    const adminDept: Department = {
      id: randomUUID(),
      name: "Administration",
      description: "System administration and management",
      headId: adminUser.id,
      createdAt: new Date(),
    };

    const financeDept: Department = {
      id: randomUUID(),
      name: "Finance",
      description: "Financial operations and budget management",
      headId: financeManager.id,
      createdAt: new Date(),
    };

    const bidsDept: Department = {
      id: randomUUID(),
      name: "Bids & Tenders",
      description: "Tender management and bid preparation",
      headId: bidder.id,
      createdAt: new Date(),
    };

    this.departments.set(adminDept.id, adminDept);
    this.departments.set(financeDept.id, financeDept);
    this.departments.set(bidsDept.id, bidsDept);

    // Assign roles to users
    const adminUserRole: UserRole = {
      id: randomUUID(),
      userId: adminUser.id,
      roleId: adminRole.id,
      assignedAt: new Date(),
    };

    const financeUserRole: UserRole = {
      id: randomUUID(),
      userId: financeManager.id,
      roleId: financeRole.id,
      assignedAt: new Date(),
    };

    const bidderUserRole: UserRole = {
      id: randomUUID(),
      userId: bidder.id,
      roleId: bidderRole.id,
      assignedAt: new Date(),
    };

    this.userRoles.set(adminUserRole.id, adminUserRole);
    this.userRoles.set(financeUserRole.id, financeUserRole);
    this.userRoles.set(bidderUserRole.id, bidderUserRole);

    // Clear tenders - will be populated from real Excel data
    this.tenders.clear();

    // Clear any existing enhanced tender results to start fresh
    this.enhancedTenderResults.clear();

    // Initialize company settings
    this.companySettings = {
      id: randomUUID(),
      companyName: "TechConstruct Pvt Ltd",
      turnoverCriteria: "5 cr",
      headquarters: "Mumbai, India",
      establishedYear: 2015,
      certifications: ["ISO 9001", "ISO 14001", "OHSAS 18001"],
      businessSectors: ["Infrastructure", "IT Solutions", "Construction"],
      updatedAt: new Date(),
      updatedBy: adminUser.id,
    };
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "manager",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Tenders
  async getTenders(): Promise<Tender[]> {
    return Array.from(this.tenders.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getTender(id: string): Promise<Tender | undefined> {
    return this.tenders.get(id);
  }

  async createTender(insertTender: InsertTender): Promise<Tender> {
    const id = randomUUID();
    const tender: Tender = {
      ...insertTender,
      id,
      description: insertTender.description || null,
      source: insertTender.source || "non_gem",
      createdAt: new Date(),
      updatedAt: new Date(),
      aiScore: null,
      link: null,
    };
    this.tenders.set(id, tender);
    return tender;
  }

  async updateTender(id: string, updates: Partial<Tender>): Promise<Tender | undefined> {
    const tender = this.tenders.get(id);
    if (!tender) return undefined;

    const updatedTender = {
      ...tender,
      ...updates,
      updatedAt: new Date(),
    };
    this.tenders.set(id, updatedTender);
    return updatedTender;
  }

  async deleteTender(id: string): Promise<boolean> {
    return this.tenders.delete(id);
  }

  async getTendersByStatus(status: string): Promise<Tender[]> {
    return Array.from(this.tenders.values()).filter(tender => tender.status === status);
  }

  // AI Recommendations
  async getRecommendations(): Promise<AIRecommendation[]> {
    return Array.from(this.recommendations.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getRecommendationsByTender(tenderId: string): Promise<AIRecommendation[]> {
    return Array.from(this.recommendations.values()).filter(
      rec => rec.tenderId === tenderId
    );
  }

  async createRecommendation(insertRecommendation: InsertAIRecommendation): Promise<AIRecommendation> {
    const id = randomUUID();
    const recommendation: AIRecommendation = {
      ...insertRecommendation,
      id,
      metadata: insertRecommendation.metadata || {},
      priority: insertRecommendation.priority || "medium",
      actionable: insertRecommendation.actionable ?? true,
      createdAt: new Date(),
    };
    this.recommendations.set(id, recommendation);
    return recommendation;
  }

  // Documents
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentsByTender(tenderId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.tenderId === tenderId);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      tenderId: insertDocument.tenderId || null,
      uploadedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Analytics - Updated for Appentus
  async getDashboardStats(): Promise<DashboardStats> {
    const results = Array.from(this.enhancedTenderResults.values());
    
    // Filter for Appentus participation
    const appentusResults = results.filter(r => {
      const isWinner = r.awardedTo?.toLowerCase().includes("appentus");
      const isParticipant = r.participatorBidders?.some(
        bidder => bidder.toLowerCase().includes("appentus")
      );
      return isWinner || isParticipant;
    });
    
    // Calculate Appentus-specific stats
    const totalParticipated = appentusResults.length;
    const totalWon = appentusResults.filter(r => 
      r.awardedTo?.toLowerCase().includes("appentus")
    ).length;
    const totalLost = appentusResults.filter(r => 
      r.status === "lost" && r.participatorBidders?.some(
        bidder => bidder.toLowerCase().includes("appentus")
      )
    ).length;
    
    // Calculate values
    const wonValue = appentusResults
      .filter(r => r.awardedTo?.toLowerCase().includes("appentus"))
      .reduce((sum, r) => sum + (r.contractValue || r.awardedValue || 0), 0);
    
    const lostValue = appentusResults
      .filter(r => r.status === "lost" && r.participatorBidders?.some(
        bidder => bidder.toLowerCase().includes("appentus")
      ))
      .reduce((sum, r) => sum + (r.ourBidValue || r.tenderValue || 0), 0);
    
    const winRate = totalParticipated > 0 
      ? Math.round((totalWon / totalParticipated) * 100) 
      : 0;

    const pendingApprovals = Array.from(this.approvals.values()).filter(a => a.status === 'pending').length;
    const pendingFinanceRequests = Array.from(this.financeRequests.values()).filter(f => f.status === 'pending').length;
    const upcomingDeadlines = Array.from(this.reminders.values()).filter(r => {
      const reminderDate = new Date(r.reminderDate);
      const now = new Date();
      const daysDiff = Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7 && daysDiff >= 0 && !r.isCompleted;
    }).length;

    return {
      activeTenders: totalParticipated,
      winRate,
      totalValue: Math.round((wonValue + lostValue) / 100), // Convert from cents to dollars
      wonValue: Math.round(wonValue / 100),
      lostValue: Math.round(lostValue / 100),
      totalWon,
      totalLost,
      totalParticipated,
      aiScore: 85, // Average AI score
      trendActiveTenders: 12, // Mock trend data
      trendWinRate: 5,
      trendTotalValue: 18,
      pendingApprovals,
      pendingFinanceRequests,
      upcomingDeadlines,
    };
  }

  async getPipelineData(): Promise<PipelineData> {
    const tenders = Array.from(this.tenders.values());
    const prospecting = tenders.filter(t => t.status === 'draft').length;
    const proposal = tenders.filter(t => t.status === 'in_progress').length;
    const negotiation = tenders.filter(t => t.status === 'submitted').length;
    const won = tenders.filter(t => t.status === 'won').length;
    const totalValue = tenders.reduce((sum, t) => sum + (t.value || 0), 0);

    return {
      prospecting,
      proposal,
      negotiation,
      won,
      totalValue: Math.round(totalValue / 100),
      avgDays: 18, // Mock average days
    };
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = randomUUID();
    const analytics: Analytics = {
      ...insertAnalytics,
      id,
      date: new Date(),
    };
    this.analytics.set(id, analytics);
    return analytics;
  }

  // Enhanced BMS Methods Implementation
  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    return Array.from(this.meetings.values());
  }

  async getMeetingsByTender(tenderId: string): Promise<Meeting[]> {
    return Array.from(this.meetings.values()).filter(m => m.tenderId === tenderId);
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = randomUUID();
    const meeting: Meeting = {
      ...insertMeeting,
      id,
      createdAt: new Date(),
      description: insertMeeting.description || null,
      status: insertMeeting.status || "scheduled",
      tenderId: insertMeeting.tenderId || null,
      meetingLink: insertMeeting.meetingLink || null,
      hostUserId: insertMeeting.hostUserId || null,
      momWriterId: insertMeeting.momWriterId || null,
      minutes: insertMeeting.minutes || null,
      attendees: insertMeeting.attendees || null,
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(id: string, meeting: Partial<Meeting>): Promise<Meeting | undefined> {
    const existing = this.meetings.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...meeting };
    this.meetings.set(id, updated);
    return updated;
  }

  // Finance Requests
  async getFinanceRequests(): Promise<FinanceRequest[]> {
    return Array.from(this.financeRequests.values());
  }

  async getFinanceRequestsByTender(tenderId: string): Promise<FinanceRequest[]> {
    return Array.from(this.financeRequests.values()).filter(f => f.tenderId === tenderId);
  }

  async getFinanceRequestsByStatus(status: string): Promise<FinanceRequest[]> {
    return Array.from(this.financeRequests.values()).filter(f => f.status === status);
  }

  async createFinanceRequest(insertRequest: InsertFinanceRequest): Promise<FinanceRequest> {
    const id = randomUUID();
    const request: FinanceRequest = {
      ...insertRequest,
      id,
      requestDate: new Date(),
      description: insertRequest.description || null,
      status: insertRequest.status || "pending",
      tenderId: insertRequest.tenderId || null,
      requesterId: insertRequest.requesterId || null,
      approvedBy: insertRequest.approvedBy || null,
      approvalDate: insertRequest.approvalDate || null,
      expiryDate: insertRequest.expiryDate || null,
      metadata: insertRequest.metadata || null,
    };
    this.financeRequests.set(id, request);
    return request;
  }

  async updateFinanceRequest(id: string, request: Partial<FinanceRequest>): Promise<FinanceRequest | undefined> {
    const existing = this.financeRequests.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...request };
    this.financeRequests.set(id, updated);
    return updated;
  }

  async getFinanceOverview(): Promise<FinanceOverview> {
    const requests = Array.from(this.financeRequests.values());
    const totalRequests = requests.length;
    const pendingAmount = requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const approvedAmount = requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);
    const emdBlocked = requests.filter(r => r.type === 'emd' && r.status === 'processed').reduce((sum, r) => sum + r.amount, 0);
    
    const now = new Date();
    const upcomingExpiries = requests.filter(r => {
      if (!r.expiryDate) return false;
      const expiryDate = new Date(r.expiryDate);
      const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 30 && daysDiff >= 0;
    });

    return {
      totalRequests,
      pendingAmount: Math.round(pendingAmount / 100),
      approvedAmount: Math.round(approvedAmount / 100),
      emdBlocked: Math.round(emdBlocked / 100),
      upcomingExpiries,
    };
  }

  // Approvals
  async getApprovals(): Promise<Approval[]> {
    return Array.from(this.approvals.values());
  }

  async getApprovalsByRequestId(requestId: string): Promise<Approval[]> {
    return Array.from(this.approvals.values()).filter(a => a.requestId === requestId);
  }

  async createApproval(insertApproval: InsertApproval): Promise<Approval> {
    const id = randomUUID();
    const approval: Approval = {
      ...insertApproval,
      id,
      createdAt: new Date(),
      status: insertApproval.status || "pending",
      approvalDate: insertApproval.approvalDate || null,
      approverId: insertApproval.approverId || null,
      comments: insertApproval.comments || null,
    };
    this.approvals.set(id, approval);
    return approval;
  }

  async updateApproval(id: string, approval: Partial<Approval>): Promise<Approval | undefined> {
    const existing = this.approvals.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...approval };
    this.approvals.set(id, updated);
    return updated;
  }

  // Tender Assignments
  async getTenderAssignments(): Promise<TenderAssignment[]> {
    return Array.from(this.tenderAssignments.values());
  }

  async getAssignmentsByTender(tenderId: string): Promise<TenderAssignment[]> {
    return Array.from(this.tenderAssignments.values()).filter(a => a.tenderId === tenderId);
  }

  async getAssignmentsByUser(userId: string): Promise<TenderAssignment[]> {
    return Array.from(this.tenderAssignments.values()).filter(a => a.assignedTo === userId);
  }

  async createTenderAssignment(insertAssignment: InsertTenderAssignment): Promise<TenderAssignment> {
    const id = randomUUID();
    const assignment: TenderAssignment = {
      ...insertAssignment,
      id,
      assignedAt: new Date(),
      status: insertAssignment.status || "assigned",
      tenderId: insertAssignment.tenderId || null,
      assignedTo: insertAssignment.assignedTo || null,
      assignedBy: insertAssignment.assignedBy || null,
      dueDate: insertAssignment.dueDate || null,
      notes: insertAssignment.notes || null,
    };
    this.tenderAssignments.set(id, assignment);
    return assignment;
  }

  async updateTenderAssignment(id: string, assignment: Partial<TenderAssignment>): Promise<TenderAssignment | undefined> {
    const existing = this.tenderAssignments.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...assignment };
    this.tenderAssignments.set(id, updated);
    return updated;
  }

  // Reminders
  async getReminders(): Promise<Reminder[]> {
    return Array.from(this.reminders.values());
  }

  async getRemindersByUser(userId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(r => r.userId === userId);
  }

  async getRemindersByTender(tenderId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(r => r.tenderId === tenderId);
  }

  async getUpcomingReminders(days: number): Promise<Reminder[]> {
    const now = new Date();
    return Array.from(this.reminders.values()).filter(r => {
      const reminderDate = new Date(r.reminderDate);
      const daysDiff = Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= days && daysDiff >= 0 && !r.isCompleted;
    });
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = randomUUID();
    const reminder: Reminder = {
      ...insertReminder,
      id,
      createdAt: new Date(),
      type: insertReminder.type || "general",
      description: insertReminder.description || null,
      tenderId: insertReminder.tenderId || null,
      userId: insertReminder.userId || null,
      isCompleted: insertReminder.isCompleted || false,
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: string, reminder: Partial<Reminder>): Promise<Reminder | undefined> {
    const existing = this.reminders.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...reminder };
    this.reminders.set(id, updated);
    return updated;
  }

  // Tender Results
  async getTenderResults(): Promise<TenderResult[]> {
    return Array.from(this.tenderResults.values());
  }

  async getTenderResultByTenderId(tenderId: string): Promise<TenderResult | undefined> {
    return Array.from(this.tenderResults.values()).find(r => r.tenderId === tenderId);
  }

  async createTenderResult(insertResult: InsertTenderResult): Promise<TenderResult> {
    const id = randomUUID();
    const result: TenderResult = {
      ...insertResult,
      id,
      createdAt: new Date(),
    };
    this.tenderResults.set(id, result);
    return result;
  }

  // Checklists
  async getChecklists(): Promise<Checklist[]> {
    return Array.from(this.checklists.values());
  }

  async getChecklistsByTender(tenderId: string): Promise<Checklist[]> {
    return Array.from(this.checklists.values()).filter(c => c.tenderId === tenderId);
  }

  async createChecklist(insertChecklist: InsertChecklist): Promise<Checklist> {
    const id = randomUUID();
    const checklist: Checklist = {
      ...insertChecklist,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.checklists.set(id, checklist);
    return checklist;
  }

  async updateChecklist(id: string, checklist: Partial<Checklist>): Promise<Checklist | undefined> {
    const existing = this.checklists.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...checklist, updatedAt: new Date() };
    this.checklists.set(id, updated);
    return updated;
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = randomUUID();
    const department: Department = {
      ...insertDepartment,
      id,
      createdAt: new Date(),
    };
    this.departments.set(id, department);
    return department;
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = randomUUID();
    const role: Role = {
      ...insertRole,
      id,
      createdAt: new Date(),
    };
    this.roles.set(id, role);
    return role;
  }

  // User Roles
  async getUserRoles(): Promise<UserRole[]> {
    return Array.from(this.userRoles.values());
  }

  async getUserRolesByUser(userId: string): Promise<UserRole[]> {
    return Array.from(this.userRoles.values()).filter(ur => ur.userId === userId);
  }

  async createUserRole(insertUserRole: InsertUserRole): Promise<UserRole> {
    const id = randomUUID();
    const userRole: UserRole = {
      ...insertUserRole,
      id,
      assignedAt: new Date(),
      userId: insertUserRole.userId || null,
      roleId: insertUserRole.roleId || null,
    };
    this.userRoles.set(id, userRole);
    return userRole;
  }

  async getUserRolesByRole(roleId: string): Promise<UserRole[]> {
    return Array.from(this.userRoles.values()).filter(ur => ur.roleId === roleId);
  }

  async deleteUserRole(id: string): Promise<boolean> {
    return this.userRoles.delete(id);
  }

  // Company Settings
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    return this.companySettings || undefined;
  }

  async updateCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const updatedSettings: CompanySettings = {
      id: this.companySettings?.id || randomUUID(),
      ...settings,
      updatedAt: new Date(),
    };
    this.companySettings = updatedSettings;
    return updatedSettings;
  }

  // Excel Uploads
  async getExcelUploads(): Promise<ExcelUpload[]> {
    return Array.from(this.excelUploads.values()).sort((a, b) => 
      new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime()
    );
  }

  async createExcelUpload(insertUpload: InsertExcelUpload): Promise<ExcelUpload> {
    const id = randomUUID();
    const upload: ExcelUpload = {
      ...insertUpload,
      id,
      uploadedAt: new Date(),
      sheetsProcessed: insertUpload.sheetsProcessed || 0,
      tendersImported: insertUpload.tendersImported || 0,
      status: insertUpload.status || "processing",
      errorLog: insertUpload.errorLog || null,
    };
    this.excelUploads.set(id, upload);
    return upload;
  }

  async updateExcelUpload(id: string, upload: Partial<ExcelUpload>): Promise<ExcelUpload | undefined> {
    const existing = this.excelUploads.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...upload };
    this.excelUploads.set(id, updated);
    return updated;
  }

  // AI Matching Logic
  async calculateAIMatch(tender: Tender, companySettings: CompanySettings): Promise<number> {
    const requirements = tender.requirements as any;
    if (!requirements) return 50; // Default score if no requirements
    
    const turnoverReq = requirements.turnover?.toLowerCase() || "";
    const companyCriteria = companySettings.turnoverCriteria.toLowerCase();
    
    // Parse turnover values
    const parseAmount = (str: string): number => {
      const match = str.match(/(\d+(?:\.\d+)?)\s*cr/i);
      return match ? parseFloat(match[1]) : 0;
    };
    
    const requiredTurnover = parseAmount(turnoverReq);
    const companyTurnover = parseAmount(companyCriteria);
    
    // Calculate match score
    if (turnoverReq.includes("exempted") || turnoverReq.includes("not applicable")) {
      return 100; // Perfect match if turnover exempted
    }
    
    if (requiredTurnover === 0) {
      return 85; // Manual review needed if turnover not specified
    }
    
    if (companyTurnover >= requiredTurnover) {
      return 100; // Perfect match if company meets requirement
    }
    
    // Partial match based on how close we are
    const ratio = companyTurnover / requiredTurnover;
    return Math.max(30, Math.min(85, Math.floor(ratio * 100)));
  }
  
  // Calculate AI match score with detailed breakdown
  async calculateAIMatchWithBreakdown(tender: Tender, companySettings: CompanySettings | undefined): Promise<{
    overallScore: number;
    breakdown: {
      criterion: string;
      requirement: string;
      companyCapability: string;
      met: boolean;
      score: number;
      reason?: string;
    }[];
  }> {
    if (!companySettings) {
      return {
        overallScore: 0,
        breakdown: [{
          criterion: 'Company Settings',
          requirement: 'Company criteria configured',
          companyCapability: 'Not configured',
          met: false,
          score: 0,
          reason: 'Please configure company settings first'
        }]
      };
    }

    const breakdown: any[] = [];
    let totalScore = 0;
    let totalCriteria = 0;

    // Check turnover eligibility
    const requirements = tender.requirements as any;
    if (requirements?.turnover) {
      totalCriteria++;
      const parseAmount = (str: string): number => {
        const match = str.match(/(\d+(?:\.\d+)?)\s*cr/i);
        return match ? parseFloat(match[1]) : 0;
      };
      
      const requiredTurnover = parseAmount(requirements.turnover);
      const companyTurnover = parseAmount(companySettings.turnoverCriteria);
      
      let criterionScore = 0;
      let met = false;
      let reason = '';
      
      if (requirements.turnover.toLowerCase().includes("exempted")) {
        criterionScore = 100;
        met = true;
        reason = 'Turnover requirement exempted';
      } else if (requiredTurnover === 0) {
        criterionScore = 85;
        met = true;
        reason = 'Manual review required - Turnover requirement not specified';
      } else if (companyTurnover >= requiredTurnover) {
        criterionScore = 100;
        met = true;
        reason = 'Turnover requirement met';
      } else {
        const ratio = companyTurnover / requiredTurnover;
        if (ratio === 0) {
          criterionScore = 0;
          reason = 'Turnover not eligible';
        } else if (ratio < 0.5) {
          criterionScore = 30;
          reason = 'Significantly below required turnover';
        } else if (ratio < 0.8) {
          criterionScore = 70;
          reason = 'Below required turnover but within range';
        } else {
          criterionScore = 90;
          reason = 'Close to required turnover';
        }
      }
      
      breakdown.push({
        criterion: 'Annual Turnover',
        requirement: requiredTurnover > 0 ? `₹${requiredTurnover} Crores` : 'Not specified',
        companyCapability: `₹${companyTurnover} Crores`,
        met,
        score: criterionScore,
        reason
      });
      
      totalScore += criterionScore;
    } else {
      // No turnover requirement specified
      totalCriteria++;
      totalScore += 100;
      breakdown.push({
        criterion: 'Annual Turnover',
        requirement: 'Not specified',
        companyCapability: companySettings.turnoverCriteria,
        met: true,
        score: 100,
        reason: 'No turnover requirement - Exempted'
      });
    }

    const overallScore = totalCriteria > 0 ? Math.round(totalScore / totalCriteria) : 0;
    
    return {
      overallScore,
      breakdown
    };
  }

  // Tender Results Import Methods
  async getTenderResultsImports(): Promise<TenderResultsImport[]> {
    return Array.from(this.tenderResultsImports.values()).sort((a, b) => 
      new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime()
    );
  }

  async createTenderResultsImport(insertImport: InsertTenderResultsImport): Promise<TenderResultsImport> {
    const id = randomUUID();
    const import_: TenderResultsImport = {
      ...insertImport,
      id,
      uploadedAt: new Date(),
      resultsProcessed: insertImport.resultsProcessed || 0,
      status: insertImport.status || "processing",
      errorLog: insertImport.errorLog || null,
    };
    this.tenderResultsImports.set(id, import_);
    return import_;
  }

  async updateTenderResultsImport(id: string, import_: Partial<TenderResultsImport>): Promise<TenderResultsImport | undefined> {
    const existing = this.tenderResultsImports.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...import_ };
    this.tenderResultsImports.set(id, updated);
    return updated;
  }

  // Enhanced Tender Results Methods
  async getEnhancedTenderResults(): Promise<EnhancedTenderResult[]> {
    return Array.from(this.enhancedTenderResults.values()).sort((a, b) => 
      new Date(b.resultDate || b.createdAt!).getTime() - new Date(a.resultDate || a.createdAt!).getTime()
    );
  }

  async createEnhancedTenderResult(insertResult: InsertEnhancedTenderResult): Promise<EnhancedTenderResult> {
    const id = randomUUID();
    const result: EnhancedTenderResult = {
      ...insertResult,
      id,
      createdAt: new Date(),
    };
    this.enhancedTenderResults.set(id, result);
    return result;
  }

  async updateEnhancedTenderResult(id: string, result: Partial<EnhancedTenderResult>): Promise<EnhancedTenderResult | undefined> {
    const existing = this.enhancedTenderResults.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...result };
    this.enhancedTenderResults.set(id, updated);
    return updated;
  }

  async getResultsByStatus(status: string): Promise<EnhancedTenderResult[]> {
    return Array.from(this.enhancedTenderResults.values()).filter(r => r.status === status);
  }

  // Enhanced Methods
  async getTenderWithDetails(id: string): Promise<TenderWithDetails | undefined> {
    const tender = this.tenders.get(id);
    if (!tender) return undefined;

    const assignments = await this.getAssignmentsByTender(id);
    const meetings = await this.getMeetingsByTender(id);
    const financeRequests = await this.getFinanceRequestsByTender(id);
    const reminders = await this.getRemindersByTender(id);
    const result = await this.getTenderResultByTenderId(id);
    const checklists = await this.getChecklistsByTender(id);

    return {
      ...tender,
      assignments,
      meetings,
      financeRequests,
      reminders,
      result,
      checklists,
    };
  }

  async getUserWithDetails(id: string): Promise<UserWithDetails | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const userRoles = await this.getUserRolesByUser(id);
    const roles = (await Promise.all(
      userRoles.map(ur => ur.roleId ? this.roles.get(ur.roleId!) : undefined)
    )).filter(Boolean) as Role[];
    
    const assignments = await this.getAssignmentsByUser(id);
    
    // Note: Department lookup would need department ID in user record
    const department = undefined; // Could be implemented if user has departmentId field

    return {
      ...user,
      department,
      roles,
      assignments,
    };
  }
}

// import { DatabaseStorage } from "./database-storage";

// Use memory storage for now to avoid database schema issues
export const storage = new MemStorage() as IStorage;

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
  type UserWithDetails
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
  createUserRole(userRole: InsertUserRole): Promise<UserRole>;
  
  // Enhanced Methods
  getTenderWithDetails(id: string): Promise<TenderWithDetails | undefined>;
  getUserWithDetails(id: string): Promise<UserWithDetails | undefined>;
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

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleUser: User = {
      id: randomUUID(),
      username: "john.manager",
      password: "password123",
      email: "john@company.com",
      name: "John Manager",
      role: "manager",
      createdAt: new Date(),
    };
    this.users.set(sampleUser.id, sampleUser);
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
      createdAt: new Date(),
      updatedAt: new Date(),
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

  // Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const tenders = Array.from(this.tenders.values());
    const activeTenders = tenders.filter(t => t.status === 'in_progress' || t.status === 'draft').length;
    const submittedTenders = tenders.filter(t => t.status === 'submitted' || t.status === 'won').length;
    const wonTenders = tenders.filter(t => t.status === 'won').length;
    const totalValue = tenders.reduce((sum, t) => sum + (t.value || 0), 0);
    const avgAiScore = tenders.length > 0 
      ? Math.round(tenders.reduce((sum, t) => sum + (t.aiScore || 0), 0) / tenders.length)
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
      activeTenders,
      winRate: submittedTenders > 0 ? Math.round((wonTenders / submittedTenders) * 100) : 0,
      totalValue: Math.round(totalValue / 100), // Convert from cents to dollars
      aiScore: avgAiScore,
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
    };
    this.userRoles.set(id, userRole);
    return userRole;
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

export const storage = new MemStorage();

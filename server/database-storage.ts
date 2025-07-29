import { 
  tenders,
  users,
  departments,
  roles,
  userRoles,
  companySettings,
  excelUploads,
  tenderResultsImport,
  enhancedTenderResults,
  tenderAssignments,
  aiRecommendations,
  type Tender, 
  type InsertTender,
  type User,
  type InsertUser,
  type Department,
  type InsertDepartment,
  type Role,
  type InsertRole,
  type UserRole,
  type InsertUserRole,
  type CompanySettings,
  type InsertCompanySettings,
  type ExcelUpload,
  type InsertExcelUpload,
  type TenderResultsImport,
  type InsertTenderResultsImport,
  type EnhancedTenderResult,
  type InsertEnhancedTenderResult,
  type TenderAssignment,
  type InsertTenderAssignment,
  type AIRecommendation,
  type InsertAIRecommendation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, gte, lte } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Tender operations
  async getTenders(): Promise<Tender[]> {
    return await db.select().from(tenders).orderBy(desc(tenders.createdAt));
  }

  async getTender(id: string): Promise<Tender | undefined> {
    const [tender] = await db.select().from(tenders).where(eq(tenders.id, id));
    return tender;
  }

  async createTender(tender: InsertTender): Promise<Tender> {
    const [newTender] = await db.insert(tenders).values(tender).returning();
    return newTender;
  }

  async updateTender(id: string, updates: Partial<Tender>): Promise<Tender | undefined> {
    const [updatedTender] = await db.update(tenders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenders.id, id))
      .returning();
    return updatedTender;
  }

  async deleteTender(id: string): Promise<boolean> {
    const result = await db.delete(tenders).where(eq(tenders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTendersByStatus(status: string): Promise<Tender[]> {
    return await db.select().from(tenders).where(eq(tenders.status, status));
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(desc(departments.createdAt));
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department | undefined> {
    const [updatedDepartment] = await db.update(departments)
      .set(updates)
      .where(eq(departments.id, id))
      .returning();
    return updatedDepartment;
  }

  async deleteDepartment(id: string): Promise<boolean> {
    const result = await db.delete(departments).where(eq(departments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Role operations
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(desc(roles.createdAt));
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<Role | undefined> {
    const [updatedRole] = await db.update(roles)
      .set(updates)
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User Role operations
  async getUserRoles(): Promise<UserRole[]> {
    return await db.select().from(userRoles);
  }

  async getUserRolesByUser(userId: string): Promise<UserRole[]> {
    return await db.select().from(userRoles).where(eq(userRoles.userId, userId));
  }

  async getUserRolesByRole(roleId: string): Promise<UserRole[]> {
    return await db.select().from(userRoles).where(eq(userRoles.roleId, roleId));
  }

  async createUserRole(userRole: InsertUserRole): Promise<UserRole> {
    const [newUserRole] = await db.insert(userRoles).values(userRole).returning();
    return newUserRole;
  }

  async deleteUserRole(id: string): Promise<boolean> {
    const result = await db.delete(userRoles).where(eq(userRoles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Company Settings operations
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings;
  }

  async updateCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    // First check if settings exist
    const existing = await this.getCompanySettings();
    
    if (existing) {
      const [updatedSettings] = await db.update(companySettings)
        .set(settings)
        .where(eq(companySettings.id, existing.id))
        .returning();
      return updatedSettings;
    } else {
      const [newSettings] = await db.insert(companySettings).values(settings).returning();
      return newSettings;
    }
  }

  // Excel Upload operations
  async getExcelUploads(): Promise<ExcelUpload[]> {
    return await db.select().from(excelUploads).orderBy(desc(excelUploads.uploadedAt));
  }

  async createExcelUpload(upload: InsertExcelUpload): Promise<ExcelUpload> {
    const [newUpload] = await db.insert(excelUploads).values(upload).returning();
    return newUpload;
  }

  async updateExcelUpload(id: string, updates: Partial<ExcelUpload>): Promise<ExcelUpload | undefined> {
    const [updatedUpload] = await db.update(excelUploads)
      .set(updates)
      .where(eq(excelUploads.id, id))
      .returning();
    return updatedUpload;
  }

  // Tender Results Import operations
  async getTenderResultsImports(): Promise<TenderResultsImport[]> {
    return await db.select().from(tenderResultsImport).orderBy(desc(tenderResultsImport.uploadedAt));
  }

  async createTenderResultsImport(import_: InsertTenderResultsImport): Promise<TenderResultsImport> {
    const [newImport] = await db.insert(tenderResultsImport).values(import_).returning();
    return newImport;
  }

  async updateTenderResultsImport(id: string, updates: Partial<TenderResultsImport>): Promise<TenderResultsImport | undefined> {
    const [updatedImport] = await db.update(tenderResultsImport)
      .set(updates)
      .where(eq(tenderResultsImport.id, id))
      .returning();
    return updatedImport;
  }

  // Enhanced Tender Results operations
  async getEnhancedTenderResults(): Promise<EnhancedTenderResult[]> {
    return await db.select().from(enhancedTenderResults).orderBy(desc(enhancedTenderResults.createdAt));
  }

  async getResultsByStatus(status: string): Promise<EnhancedTenderResult[]> {
    return await db.select().from(enhancedTenderResults).where(eq(enhancedTenderResults.status, status));
  }

  async createEnhancedTenderResult(result: InsertEnhancedTenderResult): Promise<EnhancedTenderResult> {
    const [newResult] = await db.insert(enhancedTenderResults).values(result).returning();
    return newResult;
  }

  // Tender Assignment operations
  async getTenderAssignments(): Promise<TenderAssignment[]> {
    return await db.select().from(tenderAssignments);
  }

  async getTenderAssignment(id: string): Promise<TenderAssignment | undefined> {
    const [assignment] = await db.select().from(tenderAssignments).where(eq(tenderAssignments.id, id));
    return assignment;
  }

  async createTenderAssignment(assignment: InsertTenderAssignment): Promise<TenderAssignment> {
    const [newAssignment] = await db.insert(tenderAssignments).values(assignment).returning();
    return newAssignment;
  }

  async updateTenderAssignment(id: string, updates: Partial<TenderAssignment>): Promise<TenderAssignment | undefined> {
    const [updatedAssignment] = await db.update(tenderAssignments)
      .set(updates)
      .where(eq(tenderAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteTenderAssignment(id: string): Promise<boolean> {
    const result = await db.delete(tenderAssignments).where(eq(tenderAssignments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // AI Recommendation operations
  async getRecommendations(): Promise<AIRecommendation[]> {
    return await db.select().from(aiRecommendations).orderBy(desc(aiRecommendations.createdAt));
  }

  async getRecommendationsByTender(tenderId: string): Promise<AIRecommendation[]> {
    return await db.select().from(aiRecommendations).where(eq(aiRecommendations.tenderId, tenderId));
  }

  async createRecommendation(recommendation: InsertAIRecommendation): Promise<AIRecommendation> {
    const [newRecommendation] = await db.insert(aiRecommendations).values(recommendation).returning();
    return newRecommendation;
  }

  // Advanced operations
  async getFilteredTenders(filters: any): Promise<Tender[]> {
    let query = db.select().from(tenders);
    
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(tenders.status, filters.status));
    }
    
    if (filters.organization) {
      conditions.push(like(tenders.organization, `%${filters.organization}%`));
    }
    
    if (filters.location) {
      conditions.push(like(tenders.description, `%${filters.location}%`));
    }
    
    if (filters.minValue) {
      conditions.push(gte(tenders.value, filters.minValue));
    }
    
    if (filters.maxValue) {
      conditions.push(lte(tenders.value, filters.maxValue));
    }
    
    if (filters.aiScore) {
      conditions.push(gte(tenders.aiScore, filters.aiScore));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(tenders.createdAt));
  }

  async calculateAIMatch(tender: Tender, companySettings: CompanySettings): Promise<number> {
    let score = 0;
    let totalCriteria = 0;

    // Check turnover eligibility
    const requirements = tender.requirements as any;
    if (requirements?.turnover) {
      totalCriteria++;
      const requiredTurnover = parseFloat(requirements.turnover.replace(/[^\d.]/g, '')) || 0;
      const companyTurnover = parseFloat(companySettings.turnoverCriteria.replace(/[^\d.]/g, '')) || 0;
      
      if (requiredTurnover === 0) {
        score += 85; // Manual review for unspecified turnover
      } else if (companyTurnover >= requiredTurnover) {
        score += 100; // Meets requirement
      } else {
        const ratio = companyTurnover / requiredTurnover;
        score += Math.min(ratio * 80, 80); // Proportional score up to 80%
      }
    } else {
      // No turnover requirement specified
      totalCriteria++;
      score += 100;
    }

    // Check business sectors alignment
    if (companySettings.businessSectors && companySettings.businessSectors.length > 0) {
      totalCriteria++;
      const tenderDescription = (tender.title + ' ' + tender.description).toLowerCase();
      const sectorMatch = companySettings.businessSectors.some(sector => 
        tenderDescription.includes(sector.toLowerCase())
      );
      score += sectorMatch ? 100 : 60; // Sector match bonus
    }

    // Check certifications alignment
    if (companySettings.certifications && companySettings.certifications.length > 0) {
      totalCriteria++;
      const tenderText = (tender.title + ' ' + (tender.description || '') + ' ' + JSON.stringify(tender.requirements || {})).toLowerCase();
      const certMatch = companySettings.certifications.some(cert => 
        tenderText.includes(cert.toLowerCase())
      );
      score += certMatch ? 100 : 70; // Certification match bonus
    }

    return totalCriteria > 0 ? Math.round(score / totalCriteria) : 50;
  }

  // Missing methods from IStorage interface - add stubs for now
  async getDocuments(): Promise<any[]> {
    return [];
  }

  async getDocumentsByTender(tenderId: string): Promise<any[]> {
    return [];
  }

  async createDocument(document: any): Promise<any> {
    return { id: "stub", ...document };
  }

  async deleteDocument(id: string): Promise<boolean> {
    return true;
  }

  async getDashboardStats(): Promise<any> {
    const tendersList = await this.getTenders();
    const activeTenders = tendersList.filter(t => t.status === 'active').length;
    const totalValue = tendersList.reduce((sum, t) => sum + (t.value || 0), 0);
    
    return {
      activeTenders,
      winRate: 0,
      totalValue,
      monthlyGrowth: 0
    };
  }

  async getPipelineData(): Promise<any> {
    return {
      prospecting: 0,
      proposal: 0,
      negotiation: 0,
      awarded: 0
    };
  }

  async createAnalytics(analytics: any): Promise<any> {
    return { id: "stub", ...analytics };
  }

  async getMeetings(): Promise<any[]> {
    return [];
  }

  async getMeetingsByTender(tenderId: string): Promise<any[]> {
    return [];
  }

  async createMeeting(meeting: any): Promise<any> {
    return { id: "stub", ...meeting };
  }

  async updateMeeting(id: string, meeting: any): Promise<any> {
    return { id, ...meeting };
  }

  async deleteMeeting(id: string): Promise<boolean> {
    return true;
  }

  async getFinanceRequests(): Promise<any[]> {
    return [];
  }

  async getFinanceRequestsByTender(tenderId: string): Promise<any[]> {
    return [];
  }

  async createFinanceRequest(request: any): Promise<any> {
    return { id: "stub", ...request };
  }

  async updateFinanceRequest(id: string, request: any): Promise<any> {
    return { id, ...request };
  }

  async deleteFinanceRequest(id: string): Promise<boolean> {
    return true;
  }

  async getApprovals(): Promise<any[]> {
    return [];
  }

  async getApprovalsByRequest(requestId: string): Promise<any[]> {
    return [];
  }

  async createApproval(approval: any): Promise<any> {
    return { id: "stub", ...approval };
  }

  async updateApproval(id: string, approval: any): Promise<any> {
    return { id, ...approval };
  }

  async deleteApproval(id: string): Promise<boolean> {
    return true;
  }

  async getReminders(): Promise<any[]> {
    return [];
  }

  async getRemindersByUser(userId: string): Promise<any[]> {
    return [];
  }

  async createReminder(reminder: any): Promise<any> {
    return { id: "stub", ...reminder };
  }

  async updateReminder(id: string, reminder: any): Promise<any> {
    return { id, ...reminder };
  }

  async deleteReminder(id: string): Promise<boolean> {
    return true;
  }

  async getTenderResults(): Promise<any[]> {
    return [];
  }

  async createTenderResult(result: any): Promise<any> {
    return { id: "stub", ...result };
  }

  async getChecklists(): Promise<any[]> {
    return [];
  }

  async getChecklistsByTender(tenderId: string): Promise<any[]> {
    return [];
  }

  async createChecklist(checklist: any): Promise<any> {
    return { id: "stub", ...checklist };
  }

  async updateChecklist(id: string, checklist: any): Promise<any> {
    return { id, ...checklist };
  }

  async deleteChecklist(id: string): Promise<boolean> {
    return true;
  }
}
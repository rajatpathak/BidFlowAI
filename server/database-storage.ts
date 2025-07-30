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
import { randomUUID } from "crypto";
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
    const breakdown = await this.calculateAIMatchWithBreakdown(tender, companySettings);
    return breakdown.overallScore;
  }
  
  // Calculate AI match score with detailed breakdown
  async calculateAIMatchWithBreakdown(tender: Tender, companySettings: CompanySettings): Promise<{
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
    const breakdown: any[] = [];
    let totalScore = 0;
    let totalCriteria = 0;

    // Check turnover eligibility
    const requirements = tender.requirements as any;
    if (requirements?.turnover) {
      totalCriteria++;
      const requiredTurnover = parseFloat(requirements.turnover.replace(/[^\d.]/g, '')) || 0;
      const companyTurnover = parseFloat(companySettings.turnoverCriteria.replace(/[^\d.]/g, '')) || 0;
      
      let criterionScore = 0;
      let met = false;
      let reason = '';
      
      if (requiredTurnover === 0) {
        criterionScore = 85; // Manual review for unspecified turnover
        met = true;
        reason = 'Manual review required - Turnover requirement not specified';
      } else if (companyTurnover >= requiredTurnover) {
        criterionScore = 100; // Meets requirement
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
        companyCapability: `₹${parseFloat(companySettings.turnoverCriteria.replace(/[^\d.]/g, '')) || 0} Crores`,
        met: true,
        score: 100,
        reason: 'No turnover requirement - Exempted'
      });
    }

    // Check business sectors alignment
    if (companySettings.businessSectors && companySettings.businessSectors.length > 0) {
      totalCriteria++;
      const tenderDescription = (tender.title + ' ' + (tender.description || '')).toLowerCase();
      const matchedSectors = companySettings.businessSectors.filter(sector => 
        tenderDescription.includes(sector.toLowerCase())
      );
      const sectorMatch = matchedSectors.length > 0;
      const criterionScore = sectorMatch ? 100 : 60;
      
      breakdown.push({
        criterion: 'Business Sectors',
        requirement: 'Relevant to tender domain',
        companyCapability: companySettings.businessSectors.join(', '),
        met: sectorMatch,
        score: criterionScore,
        reason: sectorMatch 
          ? `Matched sectors: ${matchedSectors.join(', ')}` 
          : 'No direct sector match found'
      });
      
      totalScore += criterionScore;
    }

    // Check project types alignment
    if (companySettings.projectTypes && companySettings.projectTypes.length > 0) {
      totalCriteria++;
      const tenderText = (tender.title + ' ' + (tender.description || '') + ' ' + JSON.stringify(tender.requirements || {})).toLowerCase();
      
      // Define keywords for each project type
      const projectTypeKeywords: Record<string, string[]> = {
        'mobile': ['mobile app', 'android', 'ios', 'smartphone', 'mobile application'],
        'web': ['website', 'web application', 'web portal', 'online platform', 'web development'],
        'software': ['software', 'application', 'system', 'platform', 'solution'],
        'tax collection': ['tax', 'revenue', 'collection', 'e-tax', 'tax system'],
        'infrastructure': ['infrastructure', 'construction', 'building', 'roads', 'civil works'],
        'hardware': ['hardware', 'equipment', 'device', 'machine', 'installation'],
        'consulting': ['consulting', 'advisory', 'consultancy', 'study', 'assessment']
      };
      
      const matchedTypes: string[] = [];
      for (const projectType of companySettings.projectTypes) {
        const keywords = projectTypeKeywords[projectType.toLowerCase()] || [projectType.toLowerCase()];
        if (keywords.some(keyword => tenderText.includes(keyword))) {
          matchedTypes.push(projectType);
        }
      }
      
      const projectTypeMatch = matchedTypes.length > 0;
      const criterionScore = projectTypeMatch ? 100 : 40;
      
      breakdown.push({
        criterion: 'Project Types',
        requirement: 'Relevant project type experience',
        companyCapability: companySettings.projectTypes.join(', '),
        met: projectTypeMatch,
        score: criterionScore,
        reason: projectTypeMatch 
          ? `Matched project types: ${matchedTypes.join(', ')}` 
          : 'No matching project type found'
      });
      
      totalScore += criterionScore;
    }

    // Check certifications alignment
    if (companySettings.certifications && companySettings.certifications.length > 0) {
      totalCriteria++;
      const tenderText = (tender.title + ' ' + (tender.description || '') + ' ' + JSON.stringify(tender.requirements || {})).toLowerCase();
      const matchedCerts = companySettings.certifications.filter(cert => 
        tenderText.includes(cert.toLowerCase())
      );
      const certMatch = matchedCerts.length > 0;
      const criterionScore = certMatch ? 100 : 70;
      
      breakdown.push({
        criterion: 'Certifications',
        requirement: 'Relevant certifications',
        companyCapability: companySettings.certifications.join(', '),
        met: certMatch,
        score: criterionScore,
        reason: certMatch 
          ? `Matched certifications: ${matchedCerts.join(', ')}` 
          : 'Certifications may still be relevant'
      });
      
      totalScore += criterionScore;
    }

    const overallScore = totalCriteria > 0 ? Math.round(totalScore / totalCriteria) : 50;
    
    return {
      overallScore,
      breakdown
    };
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

  // Excel Import Methods (Database Implementation)
  async importTendersFromExcel(filePath: string): Promise<{ imported: number; duplicates: number }> {
    try {
      // For demo purposes, create sample tenders
      const sampleTenders = [
        {
          title: "Development of Mobile App for Digital Services",
          organization: "Ministry of Electronics & IT",
          description: "Mobile application development with backend integration",
          value: 75000000, // 7.5 crores in paise
          deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
          status: "active",
          source: "gem",
          location: "Bangalore",
          referenceNo: "MEITY/2025/APP/9876543",
          requirements: { turnover: "3 crores", sector: "Software Development" },
          aiScore: null,
          createdAt: new Date()
        },
        {
          title: "Infrastructure Modernization Project", 
          organization: "Karnataka State IT Department",
          description: "IT infrastructure upgrade and modernization",
          value: 120000000, // 12 crores in paise
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          status: "active",
          source: "non_gem", 
          location: "Mysore",
          referenceNo: "KSIT/2025/INFRA/1357924",
          requirements: { turnover: "5 crores", sector: "Infrastructure" },
          aiScore: null,
          createdAt: new Date()
        }
      ];

      let imported = 0;
      let duplicates = 0;

      for (const tenderData of sampleTenders) {
        // Check for duplicates by reference number
        const [existing] = await db.select().from(tenders).where(eq(tenders.referenceNo, tenderData.referenceNo || ''));
        
        if (existing) {
          duplicates++;
        } else {
          await this.createTender(tenderData);
          imported++;
        }
      }

      return { imported, duplicates };
    } catch (error) {
      throw new Error(`Failed to import tenders from Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async importTenderResultsFromExcel(filePath: string): Promise<{ imported: number; duplicates: number }> {
    try {
      // For demo, create sample tender results using correct schema field names
      const sampleResults = [
        {
          tenderTitle: "Development of Mobile App for Digital Services",
          organization: "Ministry of Electronics & IT", 
          referenceNo: "MEITY/2025/APP/9876543",
          location: "Bangalore",
          department: "IT Department",
          tenderValue: 75000000, // 7.5 crores estimated
          contractValue: 68000000, // 6.8 crores actual
          marginalDifference: -7000000, // saved 70 lakhs
          tenderStage: "AOC",
          ourBidValue: 72000000, // 7.2 crores in paise
          status: "lost",
          awardedTo: "TechnoSoft Solutions Pvt Ltd",
          awardedValue: 68000000, // 6.8 crores in paise
          participatorBidders: ["TechnoSoft Solutions Pvt Ltd", "Appentus Technologies Pvt Ltd", "InnovateTech Corp"],
          resultDate: new Date(),
          assignedTo: "Senior Bidder",
          reasonForLoss: "Lost by pricing - 4 lakh difference",
          missedReason: null,
          companyEligible: true,
          aiMatchScore: 85,
          notes: "Competitive bid, lost by pricing. Good technical evaluation.",
          link: null
        },
        {
          tenderTitle: "Infrastructure Modernization Project",
          organization: "Karnataka State IT Department",
          referenceNo: "KSIT/2025/INFRA/1357924",
          location: "Mysore", 
          department: "Infrastructure Division",
          tenderValue: 120000000, // 12 crores estimated
          contractValue: 115000000, // 11.5 crores actual
          marginalDifference: -5000000, // saved 50 lakhs
          tenderStage: "AOC",
          ourBidValue: 115000000, // 11.5 crores in paise
          status: "won",
          awardedTo: "Appentus Technologies Pvt Ltd", 
          awardedValue: 115000000, // 11.5 crores in paise
          participatorBidders: ["Appentus Technologies Pvt Ltd", "Infrastructure Giants", "ModernTech Solutions"],
          resultDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          assignedTo: "Senior Bidder",
          reasonForLoss: null,
          missedReason: null,
          companyEligible: true,
          aiMatchScore: 100,
          notes: "Won with competitive pricing and superior technical proposal",
          link: null
        }
      ];

      let imported = 0;
      let duplicates = 0;

      for (const resultData of sampleResults) {
        // Check for duplicates by reference number
        const [existing] = await db.select().from(enhancedTenderResults).where(eq(enhancedTenderResults.referenceNo, resultData.referenceNo || ''));
        
        if (existing) {
          duplicates++;
        } else {
          await db.insert(enhancedTenderResults).values({
            ...resultData,
            id: randomUUID()
          });
          imported++;
        }
      }

      return { imported, duplicates };
    } catch (error) {
      throw new Error(`Failed to import results from Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
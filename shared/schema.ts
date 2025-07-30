import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, int, boolean, timestamp, json, bigint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("manager"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenders = mysqlTable("tenders", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  description: text("description"),
  value: bigint("value", { mode: "number" }).notNull(), // in cents
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("draft"), // draft, in_progress, submitted, won, lost, assigned
  source: text("source").notNull().default("non_gem"), // gem, non_gem
  aiScore: int("ai_score").default(0), // 0-100
  requirements: json("requirements").default([]),
  documents: json("documents").default([]),
  bidContent: text("bid_content"),
  assignedTo: text("assigned_to"), // username or role of assigned bidder
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiRecommendations = mysqlTable("ai_recommendations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenderId: varchar("tender_id", { length: 36 }).references(() => tenders.id),
  type: text("type").notNull(), // match, optimization, risk, deadline
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  actionable: boolean("actionable").default(true),
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = mysqlTable("documents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenderId: varchar("tender_id", { length: 36 }).references(() => tenders.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: int("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const analytics = mysqlTable("analytics", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  metric: text("metric").notNull(),
  value: text("value").notNull(),
  period: text("period").notNull(), // daily, weekly, monthly
  date: timestamp("date").defaultNow(),
});

// Enhanced BMS Features from Proposal
export const meetings = mysqlTable("meetings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenderId: varchar("tender_id", { length: 36 }).references(() => tenders.id),
  title: text("title").notNull(),
  description: text("description"),
  meetingDate: timestamp("meeting_date").notNull(),
  meetingLink: text("meeting_link"),
  hostUserId: varchar("host_user_id", { length: 36 }).references(() => users.id),
  momWriterId: varchar("mom_writer_id", { length: 36 }).references(() => users.id),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  minutes: text("minutes"),
  attendees: json("attendees").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const financeRequests = mysqlTable("finance_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenderId: varchar("tender_id", { length: 36 }).references(() => tenders.id),
  requesterId: varchar("requester_id", { length: 36 }).references(() => users.id),
  type: text("type").notNull(), // emd, pbg, document_fee, other
  amount: int("amount").notNull(), // in cents
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, processed
  approvedBy: varchar("approved_by", { length: 36 }).references(() => users.id),
  requestDate: timestamp("request_date").defaultNow(),
  approvalDate: timestamp("approval_date"),
  expiryDate: timestamp("expiry_date"),
  metadata: json("metadata").default({}),
});

export const approvals = mysqlTable("approvals", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  requestId: varchar("request_id", { length: 36 }).notNull(), // Can reference different types of requests
  requestType: text("request_type").notNull(), // finance, tender, document, etc
  approverId: varchar("approver_id", { length: 36 }).references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  comments: text("comments"),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenderAssignments = mysqlTable("tender_assignments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenderId: varchar("tender_id", { length: 36 }).references(() => tenders.id),
  assignedTo: varchar("assigned_to", { length: 36 }).references(() => users.id),
  assignedBy: varchar("assigned_by", { length: 36 }).references(() => users.id),
  status: text("status").notNull().default("assigned"), // assigned, accepted, completed
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
});

export const reminders = mysqlTable("reminders", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenderId: varchar("tender_id", { length: 36 }).references(() => tenders.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  reminderDate: timestamp("reminder_date").notNull(),
  type: text("type").notNull().default("deadline"), // deadline, meeting, document, custom
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenderResults = mysqlTable("tender_results", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenderId: varchar("tender_id", { length: 36 }).references(() => tenders.id),
  winner: text("winner"),
  ourRank: int("our_rank"),
  ourBidAmount: int("our_bid_amount"), // in cents
  winningAmount: int("winning_amount"), // in cents
  totalBidders: int("total_bidders"),
  resultDate: timestamp("result_date"),
  notes: text("notes"),
  competitors: json("competitors").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checklists = mysqlTable("checklists", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenderId: varchar("tender_id", { length: 36 }).references(() => tenders.id),
  title: text("title").notNull(),
  items: json("items").default([]), // Array of checklist items with completion status
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
  completionPercentage: int("completion_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const departments = mysqlTable("departments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull(),
  description: text("description"),
  headId: varchar("head_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roles = mysqlTable("roles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: json("permissions").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = mysqlTable("user_roles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  roleId: varchar("role_id", { length: 36 }).references(() => roles.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTenderSchema = createInsertSchema(tenders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  date: true,
});

// Enhanced BMS Insert Schemas
export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
});

export const insertFinanceRequestSchema = createInsertSchema(financeRequests).omit({
  id: true,
  requestDate: true,
});

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  createdAt: true,
});

export const insertTenderAssignmentSchema = createInsertSchema(tenderAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

export const insertTenderResultSchema = createInsertSchema(tenderResults).omit({
  id: true,
  createdAt: true,
});

export const insertChecklistSchema = createInsertSchema(checklists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  assignedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tender = typeof tenders.$inferSelect;
export type InsertTender = z.infer<typeof insertTenderSchema>;

export type AIRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAIRecommendation = z.infer<typeof insertRecommendationSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

// Enhanced BMS Types
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type FinanceRequest = typeof financeRequests.$inferSelect;
export type InsertFinanceRequest = z.infer<typeof insertFinanceRequestSchema>;

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;

export type TenderAssignment = typeof tenderAssignments.$inferSelect;
export type InsertTenderAssignment = z.infer<typeof insertTenderAssignmentSchema>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

export type TenderResult = typeof tenderResults.$inferSelect;
export type InsertTenderResult = z.infer<typeof insertTenderResultSchema>;

export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;



// API Response types
export type DashboardStats = {
  activeTenders: number;
  winRate: number;
  totalValue: number;
  wonValue?: number;
  lostValue?: number;
  totalWon?: number;
  totalLost?: number;
  totalParticipated?: number;
  aiScore: number;
  trendActiveTenders: number;
  trendWinRate: number;
  trendTotalValue: number;
  pendingApprovals: number;
  pendingFinanceRequests: number;
  upcomingDeadlines: number;
};

export type PipelineData = {
  prospecting: number;
  proposal: number;
  negotiation: number;
  won: number;
  totalValue: number;
  avgDays: number;
};

// Enhanced BMS API Response Types
export type TenderWithDetails = Tender & {
  assignments?: TenderAssignment[];
  meetings?: Meeting[];
  financeRequests?: FinanceRequest[];
  reminders?: Reminder[];
  result?: TenderResult;
  checklists?: Checklist[];
};

export type FinanceOverview = {
  totalRequests: number;
  pendingAmount: number;
  approvedAmount: number;
  emdBlocked: number;
  upcomingExpiries: FinanceRequest[];
};

export type UserWithDetails = User & {
  department?: Department;
  roles?: Role[];
  assignments?: TenderAssignment[];
};

// Company Settings table for admin configuration
export const companySettings = mysqlTable("company_settings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  turnoverCriteria: varchar("turnover_criteria", { length: 50 }).notNull(), // e.g., "5 cr"
  headquarters: varchar("headquarters", { length: 255 }),
  establishedYear: int("established_year"),
  certifications: json("certifications").default([]),
  businessSectors: json("business_sectors").default([]),
  projectTypes: json("project_types").default([]), // e.g., ["mobile", "web", "software", "tax collection", "infrastructure"]
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by", { length: 36 }),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  updatedAt: true,
});

// Excel Upload History table
export const excelUploads = mysqlTable("excel_uploads", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: varchar("uploaded_by", { length: 36 }),
  entriesAdded: int("entries_added").default(0),
  entriesRejected: int("entries_rejected").default(0),
  entriesDuplicate: int("entries_duplicate").default(0),
  totalEntries: int("total_entries").default(0),
  sheetsProcessed: int("sheets_processed").default(0),
  status: varchar("status", { length: 50 }).notNull().default("processing"), // processing, completed, failed
  errorLog: text("error_log"),
  processingTime: int("processing_time"), // in milliseconds
});

export const insertExcelUploadSchema = createInsertSchema(excelUploads).omit({
  id: true,
  uploadedAt: true,
});

// Tender Imports table for tracking active tender uploads
export const tenderImports = mysqlTable("tender_imports", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: varchar("uploaded_by", { length: 36 }),
  tendersProcessed: int("tenders_processed").default(0),
  duplicatesSkipped: int("duplicates_skipped").default(0),
  status: varchar("status", { length: 50 }).notNull().default("processing"), // processing, completed, failed
  errorLog: text("error_log"),
});

// Tender Results Import table for tracking uploaded results
export const tenderResultsImport = mysqlTable("tender_results_import", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: varchar("uploaded_by", { length: 36 }),
  resultsProcessed: int("results_processed").default(0),
  status: varchar("status", { length: 50 }).notNull().default("processing"), // processing, completed, failed
  errorLog: text("error_log"),
});

export const insertTenderImportSchema = createInsertSchema(tenderImports).omit({
  id: true,
  uploadedAt: true,
});

export const insertTenderResultsImportSchema = createInsertSchema(tenderResultsImport).omit({
  id: true,
  uploadedAt: true,
});

// Enhanced Tender Results with award tracking
export const enhancedTenderResults = mysqlTable("enhanced_tender_results", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tenderTitle: varchar("tender_title", { length: 500 }).notNull(),
  organization: varchar("organization", { length: 255 }).notNull(),
  referenceNo: varchar("reference_no", { length: 100 }),
  location: varchar("location", { length: 255 }), // new field
  department: varchar("department", { length: 255 }), // new field
  tenderValue: bigint("tender_value", { mode: "number" }), // in cents (estimated value)
  contractValue: bigint("contract_value", { mode: "number" }), // in cents (actual awarded value)
  marginalDifference: bigint("marginal_difference", { mode: "number" }), // in cents (contractValue - tenderValue)
  tenderStage: varchar("tender_stage", { length: 100 }), // new field
  ourBidValue: bigint("our_bid_value", { mode: "number" }), // in cents
  status: varchar("status", { length: 50 }).notNull(), // won, lost, rejected, missed_opportunity
  awardedTo: varchar("awarded_to", { length: 255 }), // company name who won (winner bidder)
  awardedValue: bigint("awarded_value", { mode: "number" }), // winning bid amount in cents
  participatorBidders: json("participator_bidders").default([]), // new field - list of all bidders
  resultDate: timestamp("result_date"),
  assignedTo: varchar("assigned_to", { length: 36 }), // our bidder who worked on it
  reasonForLoss: varchar("reason_for_loss", { length: 500 }),
  missedReason: varchar("missed_reason", { length: 500 }), // why we missed (not assigned, didn't meet criteria, etc.)
  companyEligible: boolean("company_eligible").default(true), // based on company criteria
  aiMatchScore: int("ai_match_score"), // AI matching score at time of tender
  notes: text("notes"),
  link: varchar("link", { length: 1000 }), // Link extracted from tender result brief
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnhancedTenderResultSchema = createInsertSchema(enhancedTenderResults).omit({
  id: true,
  createdAt: true,
});

// Additional types for the new schema definitions
export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;

export type ExcelUpload = typeof excelUploads.$inferSelect;
export type InsertExcelUpload = z.infer<typeof insertExcelUploadSchema>;

export type TenderResultsImport = typeof tenderResultsImport.$inferSelect;
export type InsertTenderResultsImport = z.infer<typeof insertTenderResultsImportSchema>;

export type EnhancedTenderResult = typeof enhancedTenderResults.$inferSelect;
export type InsertEnhancedTenderResult = z.infer<typeof insertEnhancedTenderResultSchema>;

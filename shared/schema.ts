import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("manager"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenders = pgTable("tenders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  description: text("description"),
  value: integer("value").notNull(), // in cents
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("draft"), // draft, in_progress, submitted, won, lost
  aiScore: integer("ai_score").default(0), // 0-100
  requirements: jsonb("requirements").default([]),
  documents: jsonb("documents").default([]),
  bidContent: text("bid_content"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiRecommendations = pgTable("ai_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").references(() => tenders.id),
  type: text("type").notNull(), // match, optimization, risk, deadline
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  actionable: boolean("actionable").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").references(() => tenders.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metric: text("metric").notNull(),
  value: text("value").notNull(),
  period: text("period").notNull(), // daily, weekly, monthly
  date: timestamp("date").defaultNow(),
});

// Enhanced BMS Features from Proposal
export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").references(() => tenders.id),
  title: text("title").notNull(),
  description: text("description"),
  meetingDate: timestamp("meeting_date").notNull(),
  meetingLink: text("meeting_link"),
  hostUserId: varchar("host_user_id").references(() => users.id),
  momWriterId: varchar("mom_writer_id").references(() => users.id),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  minutes: text("minutes"),
  attendees: jsonb("attendees").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const financeRequests = pgTable("finance_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").references(() => tenders.id),
  requesterId: varchar("requester_id").references(() => users.id),
  type: text("type").notNull(), // emd, pbg, document_fee, other
  amount: integer("amount").notNull(), // in cents
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, processed
  approvedBy: varchar("approved_by").references(() => users.id),
  requestDate: timestamp("request_date").defaultNow(),
  approvalDate: timestamp("approval_date"),
  expiryDate: timestamp("expiry_date"),
  metadata: jsonb("metadata").default({}),
});

export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(), // Can reference different types of requests
  requestType: text("request_type").notNull(), // finance, tender, document, etc
  approverId: varchar("approver_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  comments: text("comments"),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenderAssignments = pgTable("tender_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").references(() => tenders.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  assignedBy: varchar("assigned_by").references(() => users.id),
  status: text("status").notNull().default("assigned"), // assigned, accepted, completed
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").references(() => tenders.id),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  reminderDate: timestamp("reminder_date").notNull(),
  type: text("type").notNull().default("deadline"), // deadline, meeting, document, custom
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenderResults = pgTable("tender_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").references(() => tenders.id),
  winner: text("winner"),
  ourRank: integer("our_rank"),
  ourBidAmount: integer("our_bid_amount"), // in cents
  winningAmount: integer("winning_amount"), // in cents
  totalBidders: integer("total_bidders"),
  resultDate: timestamp("result_date"),
  notes: text("notes"),
  competitors: jsonb("competitors").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checklists = pgTable("checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").references(() => tenders.id),
  title: text("title").notNull(),
  items: jsonb("items").default([]), // Array of checklist items with completion status
  createdBy: varchar("created_by").references(() => users.id),
  completionPercentage: integer("completion_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  headId: varchar("head_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  roleId: varchar("role_id").references(() => roles.id),
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
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name").notNull(),
  turnoverCriteria: varchar("turnover_criteria").notNull(), // e.g., "5 cr"
  headquarters: varchar("headquarters"),
  establishedYear: integer("established_year"),
  certifications: text("certifications").array(),
  businessSectors: text("business_sectors").array(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"),
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = typeof companySettings.$inferInsert;
export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  updatedAt: true,
});

// Excel Upload History table
export const excelUploads = pgTable("excel_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: varchar("uploaded_by"),
  sheetsProcessed: integer("sheets_processed").default(0),
  tendersImported: integer("tenders_imported").default(0),
  status: varchar("status").notNull().default("processing"), // processing, completed, failed
  errorLog: text("error_log"),
});

export type ExcelUpload = typeof excelUploads.$inferSelect;
export type InsertExcelUpload = typeof excelUploads.$inferInsert;
export const insertExcelUploadSchema = createInsertSchema(excelUploads).omit({
  id: true,
  uploadedAt: true,
});

// Tender Results Import table for tracking uploaded results
export const tenderResultsImport = pgTable("tender_results_import", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: varchar("uploaded_by"),
  resultsProcessed: integer("results_processed").default(0),
  status: varchar("status").notNull().default("processing"), // processing, completed, failed
  errorLog: text("error_log"),
});

export type TenderResultsImport = typeof tenderResultsImport.$inferSelect;
export type InsertTenderResultsImport = typeof tenderResultsImport.$inferInsert;
export const insertTenderResultsImportSchema = createInsertSchema(tenderResultsImport).omit({
  id: true,
  uploadedAt: true,
});

// Enhanced Tender Results with award tracking
export const enhancedTenderResults = pgTable("enhanced_tender_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderTitle: varchar("tender_title").notNull(),
  organization: varchar("organization").notNull(),
  referenceNo: varchar("reference_no"),
  tenderValue: integer("tender_value"), // in cents
  ourBidValue: integer("our_bid_value"), // in cents
  status: varchar("status").notNull(), // won, lost, rejected, missed_opportunity
  awardedTo: varchar("awarded_to"), // company name who won
  awardedValue: integer("awarded_value"), // winning bid amount in cents
  resultDate: timestamp("result_date"),
  assignedTo: varchar("assigned_to"), // our bidder who worked on it
  reasonForLoss: varchar("reason_for_loss"),
  missedReason: varchar("missed_reason"), // why we missed (not assigned, didn't meet criteria, etc.)
  companyEligible: boolean("company_eligible").default(true), // based on company criteria
  aiMatchScore: integer("ai_match_score"), // AI matching score at time of tender
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EnhancedTenderResult = typeof enhancedTenderResults.$inferSelect;
export type InsertEnhancedTenderResult = typeof enhancedTenderResults.$inferInsert;
export const insertEnhancedTenderResultSchema = createInsertSchema(enhancedTenderResults).omit({
  id: true,
  createdAt: true,
});

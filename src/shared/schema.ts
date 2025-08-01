import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, json, jsonb, bigint, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("manager"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessed: timestamp("last_accessed").defaultNow(),
});

export const tenders = pgTable("tenders", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  description: text("description"),
  value: bigint("value", { mode: "number" }).notNull(), // in cents
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("draft"), // draft, in_progress, submitted, won, lost, assigned
  source: text("source").notNull().default("non_gem"), // gem, non_gem
  aiScore: integer("ai_score").default(0), // 0-100
  requirements: json("requirements").default([]),
  documents: json("documents").default([]),
  bidContent: text("bid_content"),
  assignedTo: text("assigned_to"), // username or role of assigned bidder
  link: text("link"), // URL to tender details
  submittedAt: timestamp("submitted_at"),
  notRelevantReason: text("not_relevant_reason"),
  notRelevantRequestedBy: uuid("not_relevant_requested_by").references(() => users.id),
  notRelevantRequestedAt: timestamp("not_relevant_requested_at"),
  notRelevantApprovedBy: uuid("not_relevant_approved_by").references(() => users.id),
  notRelevantApprovedAt: timestamp("not_relevant_approved_at"),
  notRelevantStatus: text("not_relevant_status").default("none"), // none, pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiRecommendations = pgTable("ai_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  type: text("type").notNull(), // match, optimization, risk, deadline
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  actionable: boolean("actionable").default(true),
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  metric: text("metric").notNull(),
  value: text("value").notNull(),
  period: text("period").notNull(), // daily, weekly, monthly
  date: timestamp("date").defaultNow(),
});

// Enhanced BMS Features from Proposal
export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  title: text("title").notNull(),
  description: text("description"),
  meetingDate: timestamp("meeting_date").notNull(),
  meetingLink: text("meeting_link"),
  hostUserId: uuid("host_user_id").references(() => users.id),
  momWriterId: uuid("mom_writer_id").references(() => users.id),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  minutes: text("minutes"),
  attendees: json("attendees").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const financeRequests = pgTable("finance_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  requesterId: uuid("requester_id").references(() => users.id),
  type: text("type").notNull(), // emd, pbg, document_fee, other
  amount: integer("amount").notNull(), // in cents
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, processed
  approvedBy: uuid("approved_by").references(() => users.id),
  requestDate: timestamp("request_date").defaultNow(),
  approvalDate: timestamp("approval_date"),
  expiryDate: timestamp("expiry_date"),
  metadata: json("metadata").default({}),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull(), // Can reference different types of requests
  requestType: text("request_type").notNull(), // finance, tender, document, etc
  approverId: uuid("approver_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  comments: text("comments"),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenderAssignments = pgTable("tender_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  assignedBy: uuid("assigned_by").references(() => users.id),
  status: text("status").notNull().default("assigned"), // assigned, accepted, completed
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  reminderDate: timestamp("reminder_date").notNull(),
  type: text("type").notNull().default("deadline"), // deadline, meeting, document, custom
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenderResults = pgTable("tender_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  winner: text("winner"),
  ourRank: integer("our_rank"),
  ourBidAmount: integer("our_bid_amount"), // in cents
  winningAmount: integer("winning_amount"), // in cents
  totalBidders: integer("total_bidders"),
  resultDate: timestamp("result_date"),
  notes: text("notes"),
  competitors: json("competitors").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checklists = pgTable("checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  title: text("title").notNull(),
  description: text("description"),
  items: json("items").default([]), // Array of checklist items
  completedItems: json("completed_items").default([]),
  assignedTo: uuid("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  managerId: uuid("manager_id").references(() => users.id),
  budget: integer("budget"), // in cents
  createdAt: timestamp("created_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: json("permissions").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  roleId: uuid("role_id").references(() => roles.id),
  departmentId: uuid("department_id").references(() => departments.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: uuid("assigned_by").references(() => users.id),
});

export const companySettings = pgTable("company_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  annualTurnover: bigint("annual_turnover", { mode: "number" }).notNull(), // in cents
  headquarters: text("headquarters"),
  establishedYear: integer("established_year"),
  certifications: json("certifications").default([]),
  businessSectors: json("business_sectors").default([]),
  projectTypes: json("project_types").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document Repository for storing company documents
export const documentRepository = pgTable("document_repository", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  category: text("category").notNull(), // e.g., "certificates", "technical", "financial", "legal"
  tags: json("tags").default([]), // Array of tags for searchability
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// RFP Documents uploaded for processing
export const rfpDocuments = pgTable("rfp_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  extractedContent: text("extracted_content"), // OCR or text extraction results
  processedData: json("processed_data"), // AI-extracted key information
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bid Document Templates and Types
export const bidDocumentTypes = pgTable("bid_document_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // e.g., "Pre-Qualification", "QCBS", "BOQ"
  description: text("description"),
  category: text("category").notNull(), // e.g., "standard", "custom"
  template: text("template"), // HTML template for the document
  isRequired: boolean("is_required").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual Bid Documents for each tender
export const bidDocuments = pgTable("bid_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  documentTypeId: uuid("document_type_id").references(() => bidDocumentTypes.id),
  title: text("title").notNull(),
  content: text("content"), // HTML content of the document
  status: text("status").default("pending"), // pending, draft, completed, approved
  isAutoFilled: boolean("is_auto_filled").default(false),
  aiConfidence: integer("ai_confidence"), // 0-100 confidence score from AI
  lastEditedBy: uuid("last_edited_by").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Final Bid Packages
export const bidPackages = pgTable("bid_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id),
  packageName: text("package_name").notNull(),
  status: text("status").default("draft"), // draft, under_review, approved, submitted
  documents: json("documents").default([]), // Array of document IDs included in package
  finalPdfPath: text("final_pdf_path"), // Path to generated PDF
  coverPage: text("cover_page"), // HTML content for cover page
  tableOfContents: boolean("table_of_contents").default(true),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  generatedBy: uuid("generated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const excelUploads = pgTable("excel_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  tendersProcessed: integer("tenders_processed").default(0),
  duplicatesSkipped: integer("duplicates_skipped").default(0),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  errorMessage: text("error_message"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const tenderResultsImports = pgTable("tender_results_imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  resultsProcessed: integer("results_processed").default(0),
  duplicatesSkipped: integer("duplicates_skipped").default(0),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  errorMessage: text("error_message"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const enhancedTenderResults = pgTable("enhanced_tender_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderTitle: text("tender_title").notNull(),
  organization: text("organization").notNull(),
  referenceNo: text("reference_no"),
  publishedDate: timestamp("published_date"),
  closingDate: timestamp("closing_date"),
  winnerBidder: text("winner_bidder"),
  winnerValue: bigint("winner_value", { mode: "number" }),
  participatorBidders: json("participator_bidders").default([]),
  location: text("location"),
  tenderValue: bigint("tender_value", { mode: "number" }),
  category: text("category"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tender_id: text("tender_id"),
  action: text("action").notNull(),
  details: json("details").default({}),
  created_at: timestamp("created_at").defaultNow(),
});

export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("participation"), // participation, technical, commercial, etc.
  mandatory: boolean("mandatory").default(false),
  format: text("format"), // PDF, DOC, XLS, etc.
  images: jsonb("images").$type<Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    order: number;
    url: string;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

export type Tender = typeof tenders.$inferSelect;
export type InsertTender = typeof tenders.$inferInsert;

export type AIRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAIRecommendation = typeof aiRecommendations.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

export type FinanceRequest = typeof financeRequests.$inferSelect;
export type InsertFinanceRequest = typeof financeRequests.$inferInsert;

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

export type TenderAssignment = typeof tenderAssignments.$inferSelect;
export type InsertTenderAssignment = typeof tenderAssignments.$inferInsert;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

export type TenderResult = typeof tenderResults.$inferSelect;
export type InsertTenderResult = typeof tenderResults.$inferInsert;

export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = typeof checklists.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = typeof companySettings.$inferInsert;

export type ExcelUpload = typeof excelUploads.$inferSelect;
export type InsertExcelUpload = typeof excelUploads.$inferInsert;

export type TenderResultsImport = typeof tenderResultsImports.$inferSelect;
export type InsertTenderResultsImport = typeof tenderResultsImports.$inferInsert;

export type EnhancedTenderResult = typeof enhancedTenderResults.$inferSelect;
export type InsertEnhancedTenderResult = typeof enhancedTenderResults.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = typeof documentTemplates.$inferInsert;

// New bid document system types
export type DocumentRepository = typeof documentRepository.$inferSelect;
export type InsertDocumentRepository = typeof documentRepository.$inferInsert;

export type RfpDocument = typeof rfpDocuments.$inferSelect;
export type InsertRfpDocument = typeof rfpDocuments.$inferInsert;

export type BidDocumentType = typeof bidDocumentTypes.$inferSelect;
export type InsertBidDocumentType = typeof bidDocumentTypes.$inferInsert;

export type BidDocument = typeof bidDocuments.$inferSelect;
export type InsertBidDocument = typeof bidDocuments.$inferInsert;

export type BidPackage = typeof bidPackages.$inferSelect;
export type InsertBidPackage = typeof bidPackages.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertTenderSchema = createInsertSchema(tenders);
export const insertAIRecommendationSchema = createInsertSchema(aiRecommendations);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertAnalyticsSchema = createInsertSchema(analytics);
export const insertMeetingSchema = createInsertSchema(meetings);
export const insertFinanceRequestSchema = createInsertSchema(financeRequests);
export const insertApprovalSchema = createInsertSchema(approvals);
export const insertTenderAssignmentSchema = createInsertSchema(tenderAssignments);
export const insertReminderSchema = createInsertSchema(reminders);
export const insertTenderResultSchema = createInsertSchema(tenderResults);
export const insertChecklistSchema = createInsertSchema(checklists);
export const insertDepartmentSchema = createInsertSchema(departments);
export const insertRoleSchema = createInsertSchema(roles);
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const insertCompanySettingsSchema = createInsertSchema(companySettings);
export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates);

// Extended types for dashboard analytics
export interface DashboardStats {
  activeTenders: number;
  winRate: number;
  totalValue: number;
  pendingFinanceRequests: number;
  upcomingDeadlines: number;
  completedTasks: number;
}

export interface PipelineData {
  prospecting: number;
  proposal: number;
  negotiation: number;
  awarded: number;
}

export interface TenderWithDetails {
  id: string;
  title: string;
  organization: string;
  description?: string | null;
  value: number;
  deadline: Date;
  status: string;
  source: string;
  aiScore?: number | null;
  requirements?: any;
  documents?: any;
  bidContent?: string | null;
  assignedTo?: string | null;
  link?: string | null;
  submittedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  additionalDocuments?: Document[];
  assignments?: TenderAssignment[];
  meetings?: Meeting[];
  financeRequests?: FinanceRequest[];
}

export interface FinanceOverview {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  recentRequests: FinanceRequest[];
}

export interface UserWithDetails extends User {
  roles?: UserRole[];
  departments?: Department[];
  assignments?: TenderAssignment[];
}
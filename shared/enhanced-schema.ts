import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  json, 
  jsonb, 
  bigint, 
  uuid, 
  varchar,
  decimal,
  pgEnum,
  index,
  unique,
  foreignKey
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enhanced Enums for better type safety
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "bidder", "finance_manager", "analyst"]);
export const tenderStatusEnum = pgEnum("tender_status", [
  "draft", 
  "published", 
  "in_progress", 
  "submitted", 
  "under_evaluation", 
  "won", 
  "lost", 
  "cancelled", 
  "missed_opportunity"
]);
export const tenderSourceEnum = pgEnum("tender_source", ["gem", "non_gem", "portal", "direct", "referral"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "critical"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected", "withdrawn"]);

// Enhanced Users Table with better constraints
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  role: userRoleEnum("role").notNull().default("bidder"),
  profileImage: text("profile_image"),
  phone: varchar("phone", { length: 15 }),
  department: varchar("department", { length: 100 }),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  emailVerifiedAt: timestamp("email_verified_at"),
  passwordChangedAt: timestamp("password_changed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  usernameIdx: index("users_username_idx").on(table.username),
  roleIdx: index("users_role_idx").on(table.role),
  activeIdx: index("users_active_idx").on(table.isActive),
}));

// Enhanced User Sessions with better security
export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  refreshToken: text("refresh_token"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessed: timestamp("last_accessed").defaultNow(),
}, (table) => ({
  userIdIdx: index("sessions_user_id_idx").on(table.userId),
  tokenIdx: index("sessions_token_idx").on(table.token),
  activeIdx: index("sessions_active_idx").on(table.isActive),
  expiresIdx: index("sessions_expires_idx").on(table.expiresAt),
}));

// Enhanced Tenders Table with better data types and constraints
export const tenders = pgTable("tenders", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceNumber: varchar("reference_number", { length: 100 }).unique(),
  title: text("title").notNull(),
  organization: varchar("organization", { length: 255 }).notNull(),
  description: text("description"),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(), // Better for currency
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("INR"),
  deadline: timestamp("deadline").notNull(),
  publishDate: timestamp("publish_date"),
  submissionDeadline: timestamp("submission_deadline"),
  technicalMeetingDate: timestamp("technical_meeting_date"),
  status: tenderStatusEnum("status").notNull().default("draft"),
  source: tenderSourceEnum("source").notNull().default("non_gem"),
  category: varchar("category", { length: 100 }),
  location: varchar("location", { length: 255 }),
  aiScore: integer("ai_score").default(0), // 0-100
  winProbability: decimal("win_probability", { precision: 5, scale: 2 }), // 0-100.00%
  requirements: jsonb("requirements").default([]),
  documents: jsonb("documents").default([]),
  bidContent: text("bid_content"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  assignedBy: uuid("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at"),
  link: text("link"),
  portalLink: text("portal_link"),
  submittedAt: timestamp("submitted_at"),
  submittedBy: uuid("submitted_by").references(() => users.id),
  // Not relevant workflow
  notRelevantReason: text("not_relevant_reason"),
  notRelevantRequestedBy: uuid("not_relevant_requested_by").references(() => users.id),
  notRelevantRequestedAt: timestamp("not_relevant_requested_at"),
  notRelevantApprovedBy: uuid("not_relevant_approved_by").references(() => users.id),
  notRelevantApprovedAt: timestamp("not_relevant_approved_at"),
  notRelevantStatus: approvalStatusEnum("not_relevant_status").default("pending"),
  // Metadata
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("tenders_status_idx").on(table.status),
  sourceIdx: index("tenders_source_idx").on(table.source),
  deadlineIdx: index("tenders_deadline_idx").on(table.deadline),
  assignedToIdx: index("tenders_assigned_to_idx").on(table.assignedTo),
  organizationIdx: index("tenders_organization_idx").on(table.organization),
  valueIdx: index("tenders_value_idx").on(table.value),
  aiScoreIdx: index("tenders_ai_score_idx").on(table.aiScore),
  categoryIdx: index("tenders_category_idx").on(table.category),
  createdAtIdx: index("tenders_created_at_idx").on(table.createdAt),
  // Composite indexes for common queries
  statusDeadlineIdx: index("tenders_status_deadline_idx").on(table.status, table.deadline),
  sourceStatusIdx: index("tenders_source_status_idx").on(table.source, table.status),
}));

// Enhanced Tender Assignments with better tracking
export const tenderAssignments = pgTable("tender_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").notNull().references(() => tenders.id, { onDelete: "cascade" }),
  assignedTo: uuid("assigned_to").notNull().references(() => users.id),
  assignedBy: uuid("assigned_by").notNull().references(() => users.id),
  priority: priorityEnum("priority").default("medium"),
  status: pgEnum("assignment_status", ["assigned", "accepted", "in_progress", "completed", "cancelled"])("status").default("assigned"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  notes: text("notes"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tenderIdIdx: index("assignments_tender_id_idx").on(table.tenderId),
  assignedToIdx: index("assignments_assigned_to_idx").on(table.assignedTo),
  statusIdx: index("assignments_status_idx").on(table.status),
  dueDateIdx: index("assignments_due_date_idx").on(table.dueDate),
  uniqueActiveTenderAssignment: unique("unique_active_tender_assignment").on(table.tenderId, table.assignedTo),
}));

// Enhanced Finance Requests with better approval workflow
export const financeRequests = pgTable("finance_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").notNull().references(() => tenders.id, { onDelete: "cascade" }),
  requesterId: uuid("requester_id").notNull().references(() => users.id),
  type: pgEnum("finance_type", ["emd", "pbg", "document_fee", "stamp_fee", "tender_fee", "other"])("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("INR"),
  description: text("description"),
  justification: text("justification"),
  priority: priorityEnum("priority").default("medium"),
  status: approvalStatusEnum("status").default("pending"),
  approvedBy: uuid("approved_by").references(() => users.id),
  processedBy: uuid("processed_by").references(() => users.id),
  requestDate: timestamp("request_date").defaultNow(),
  approvalDate: timestamp("approval_date"),
  processedDate: timestamp("processed_date"),
  expiryDate: timestamp("expiry_date"),
  attachments: jsonb("attachments").default([]),
  approvalComments: text("approval_comments"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tenderIdIdx: index("finance_requests_tender_id_idx").on(table.tenderId),
  requesterIdIdx: index("finance_requests_requester_id_idx").on(table.requesterId),
  statusIdx: index("finance_requests_status_idx").on(table.status),
  typeIdx: index("finance_requests_type_idx").on(table.type),
  requestDateIdx: index("finance_requests_request_date_idx").on(table.requestDate),
}));

// Enhanced Documents with better categorization and metadata
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  hash: varchar("hash", { length: 64 }), // For duplicate detection
  category: pgEnum("document_category", [
    "rfp_document", 
    "bid_document", 
    "supporting_document", 
    "compliance_document",
    "technical_document",
    "financial_document",
    "legal_document"
  ])("category").default("supporting_document"),
  isConfidential: boolean("is_confidential").default(false),
  version: integer("version").default(1),
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
  expiresAt: timestamp("expires_at"),
}, (table) => ({
  tenderIdIdx: index("documents_tender_id_idx").on(table.tenderId),
  categoryIdx: index("documents_category_idx").on(table.category),
  uploadedByIdx: index("documents_uploaded_by_idx").on(table.uploadedBy),
  hashIdx: index("documents_hash_idx").on(table.hash),
  uploadedAtIdx: index("documents_uploaded_at_idx").on(table.uploadedAt),
}));

// Enhanced AI Recommendations with better categorization
export const aiRecommendations = pgTable("ai_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderId: uuid("tender_id").references(() => tenders.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id), // Specific user recommendations
  type: pgEnum("recommendation_type", [
    "match_analysis", 
    "bid_optimization", 
    "risk_assessment", 
    "deadline_alert",
    "pricing_suggestion",
    "competitive_analysis",
    "resource_requirement"
  ])("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: priorityEnum("priority").default("medium"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100.00%
  actionable: boolean("actionable").default(true),
  isImplemented: boolean("is_implemented").default(false),
  implementedBy: uuid("implemented_by").references(() => users.id),
  implementedAt: timestamp("implemented_at"),
  impact: pgEnum("impact", ["low", "medium", "high", "critical"])("impact"),
  metadata: jsonb("metadata").default({}),
  relatedRecommendations: jsonb("related_recommendations").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => ({
  tenderIdIdx: index("ai_recommendations_tender_id_idx").on(table.tenderId),
  typeIdx: index("ai_recommendations_type_idx").on(table.type),
  priorityIdx: index("ai_recommendations_priority_idx").on(table.priority),
  actionableIdx: index("ai_recommendations_actionable_idx").on(table.actionable),
  createdAtIdx: index("ai_recommendations_created_at_idx").on(table.createdAt),
}));

// Enhanced Analytics with time-series support
export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  metric: varchar("metric", { length: 100 }).notNull(),
  value: decimal("value", { precision: 15, scale: 4 }).notNull(),
  stringValue: text("string_value"), // For non-numeric metrics
  dimension1: varchar("dimension1", { length: 100 }), // For grouping
  dimension2: varchar("dimension2", { length: 100 }),
  dimension3: varchar("dimension3", { length: 100 }),
  period: pgEnum("period", ["hourly", "daily", "weekly", "monthly", "quarterly", "yearly"])("period").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  metricIdx: index("analytics_metric_idx").on(table.metric),
  periodIdx: index("analytics_period_idx").on(table.period),
  timestampIdx: index("analytics_timestamp_idx").on(table.timestamp),
  // Composite index for time-series queries
  metricPeriodTimestampIdx: index("analytics_metric_period_timestamp_idx")
    .on(table.metric, table.period, table.timestamp),
}));

// Enhanced Activity Log for audit trail
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // tender, user, document, etc.
  entityId: uuid("entity_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // create, update, delete, assign, etc.
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("activity_logs_user_id_idx").on(table.userId),
  entityTypeIdx: index("activity_logs_entity_type_idx").on(table.entityType),
  entityIdIdx: index("activity_logs_entity_id_idx").on(table.entityId),
  actionIdx: index("activity_logs_action_idx").on(table.action),
  createdAtIdx: index("activity_logs_created_at_idx").on(table.createdAt),
  // Composite index for entity tracking
  entityTypeEntityIdIdx: index("activity_logs_entity_type_entity_id_idx")
    .on(table.entityType, table.entityId),
}));

// Define relationships for better type inference
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  assignedTenders: many(tenders, { relationName: "assignedTenders" }),
  createdTenders: many(tenders, { relationName: "createdTenders" }),
  assignments: many(tenderAssignments),
  financeRequests: many(financeRequests),
  documents: many(documents),
  recommendations: many(aiRecommendations),
  activityLogs: many(activityLogs),
}));

export const tendersRelations = relations(tenders, ({ one, many }) => ({
  assignedToUser: one(users, {
    fields: [tenders.assignedTo],
    references: [users.id],
    relationName: "assignedTenders"
  }),
  assignedByUser: one(users, {
    fields: [tenders.assignedBy],
    references: [users.id],
    relationName: "createdTenders"
  }),
  assignments: many(tenderAssignments),
  documents: many(documents),
  financeRequests: many(financeRequests),
  recommendations: many(aiRecommendations),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  username: z.string().min(3).max(50),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
  phone: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
});

export const selectUserSchema = createSelectSchema(users);

export const insertTenderSchema = createInsertSchema(tenders, {
  title: z.string().min(1).max(500),
  organization: z.string().min(1).max(255),
  value: z.string().transform((val) => parseFloat(val)),
  deadline: z.string().datetime(),
  description: z.string().optional(),
});

export const selectTenderSchema = createSelectSchema(tenders);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Tender = typeof tenders.$inferSelect;
export type InsertTender = z.infer<typeof insertTenderSchema>;
export type TenderAssignment = typeof tenderAssignments.$inferSelect;
export type InsertTenderAssignment = typeof tenderAssignments.$inferInsert;
export type FinanceRequest = typeof financeRequests.$inferSelect;
export type InsertFinanceRequest = typeof financeRequests.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type AIRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAIRecommendation = typeof aiRecommendations.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
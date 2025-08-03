import { db } from '../db.js';
import { sql, eq, desc, asc, and, or, gte, lte, ilike, count, avg, sum, max, min } from 'drizzle-orm';
import { 
  users, 
  tenders, 
  tenderAssignments, 
  financeRequests, 
  documents, 
  aiRecommendations, 
  analytics,
  activityLogs
} from '../../shared/schema.js';

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class DatabaseService {
  /**
   * Generic paginated query with filtering and search
   */
  static async paginatedQuery<T>(
    table: any,
    options: QueryOptions = {},
    additionalConditions?: any[]
  ): Promise<PaginationResult<T>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
      search
    } = options;

    const offset = (page - 1) * limit;
    const conditions = additionalConditions || [];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          conditions.push(sql`${table[key]} IN ${value}`);
        } else {
          conditions.push(eq(table[key], value));
        }
      }
    });

    // Apply search if provided
    if (search && table.title && table.description) {
      conditions.push(
        or(
          ilike(table.title, `%${search}%`),
          ilike(table.description, `%${search}%`)
        )
      );
    }

    // Build base query
    let query = db.select().from(table);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = table[sortBy] || table.createdAt;
    query = sortOrder === 'desc' ? 
      query.orderBy(desc(sortColumn)) : 
      query.orderBy(asc(sortColumn));

    // Execute paginated query
    const data = await query.limit(limit).offset(offset);

    // Get total count
    let countQuery = db.select({ count: count() }).from(table);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count: total }] = await countQuery;

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Advanced tender analytics
   */
  static async getTenderAnalytics(dateRange?: { start: Date; end: Date }) {
    const conditions = [];
    
    if (dateRange) {
      conditions.push(
        and(
          gte(tenders.createdAt, dateRange.start),
          lte(tenders.createdAt, dateRange.end)
        )
      );
    }

    // Status distribution
    const statusStats = await db
      .select({
        status: tenders.status,
        count: count(),
        totalValue: sum(tenders.value),
        avgValue: avg(tenders.value)
      })
      .from(tenders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(tenders.status);

    // Source distribution
    const sourceStats = await db
      .select({
        source: tenders.source,
        count: count(),
        totalValue: sum(tenders.value)
      })
      .from(tenders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(tenders.source);

    // Monthly trends
    const monthlyTrends = await db
      .select({
        month: sql<string>`date_trunc('month', ${tenders.createdAt})`,
        count: count(),
        totalValue: sum(tenders.value),
        avgAiScore: avg(tenders.aiScore)
      })
      .from(tenders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(sql`date_trunc('month', ${tenders.createdAt})`)
      .orderBy(sql`date_trunc('month', ${tenders.createdAt})`);

    // Top organizations
    const topOrganizations = await db
      .select({
        organization: tenders.organization,
        count: count(),
        totalValue: sum(tenders.value),
        avgValue: avg(tenders.value)
      })
      .from(tenders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(tenders.organization)
      .orderBy(desc(count()))
      .limit(10);

    return {
      statusDistribution: statusStats,
      sourceDistribution: sourceStats,
      monthlyTrends,
      topOrganizations,
      summary: {
        totalTenders: statusStats.reduce((sum, s) => sum + s.count, 0),
        totalValue: statusStats.reduce((sum, s) => sum + (s.totalValue || 0), 0),
        averageValue: statusStats.reduce((sum, s, _, arr) => 
          sum + (s.avgValue || 0) / arr.length, 0
        )
      }
    };
  }

  /**
   * User performance analytics
   */
  static async getUserPerformance(userId?: string, dateRange?: { start: Date; end: Date }) {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(tenders.assignedTo, userId));
    }
    
    if (dateRange) {
      conditions.push(
        and(
          gte(tenders.createdAt, dateRange.start),
          lte(tenders.createdAt, dateRange.end)
        )
      );
    }

    // User assignment stats
    const userStats = await db
      .select({
        assignedTo: tenders.assignedTo,
        userName: users.name,
        totalAssigned: count(),
        completed: sql<number>`sum(case when ${tenders.status} = 'won' then 1 else 0 end)`,
        inProgress: sql<number>`sum(case when ${tenders.status} = 'in_progress' then 1 else 0 end)`,
        totalValue: sum(tenders.value),
        avgAiScore: avg(tenders.aiScore)
      })
      .from(tenders)
      .leftJoin(users, eq(tenders.assignedTo, users.id))
      .where(
        and(
          sql`${tenders.assignedTo} IS NOT NULL`,
          ...(conditions.length > 0 ? conditions : [])
        )
      )
      .groupBy(tenders.assignedTo, users.name)
      .orderBy(desc(count()));

    return userStats;
  }

  /**
   * Finance overview analytics
   */
  static async getFinanceAnalytics(dateRange?: { start: Date; end: Date }) {
    const conditions = [];
    
    if (dateRange) {
      conditions.push(
        and(
          gte(financeRequests.requestDate, dateRange.start),
          lte(financeRequests.requestDate, dateRange.end)
        )
      );
    }

    // Finance request stats by type
    const typeStats = await db
      .select({
        type: financeRequests.type,
        count: count(),
        totalAmount: sum(financeRequests.amount),
        avgAmount: avg(financeRequests.amount),
        approved: sql<number>`sum(case when ${financeRequests.status} = 'approved' then 1 else 0 end)`,
        pending: sql<number>`sum(case when ${financeRequests.status} = 'pending' then 1 else 0 end)`
      })
      .from(financeRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(financeRequests.type);

    // Monthly finance trends
    const monthlyFinance = await db
      .select({
        month: sql<string>`date_trunc('month', ${financeRequests.requestDate})`,
        count: count(),
        totalAmount: sum(financeRequests.amount),
        approvedAmount: sql<number>`sum(case when ${financeRequests.status} = 'approved' then ${financeRequests.amount} else 0 end)`
      })
      .from(financeRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(sql`date_trunc('month', ${financeRequests.requestDate})`)
      .orderBy(sql`date_trunc('month', ${financeRequests.requestDate})`);

    return {
      typeDistribution: typeStats,
      monthlyTrends: monthlyFinance,
      summary: {
        totalRequests: typeStats.reduce((sum, s) => sum + s.count, 0),
        totalAmount: typeStats.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
        approvedAmount: typeStats.reduce((sum, s) => sum + (s.approved || 0), 0)
      }
    };
  }

  /**
   * Document analytics
   */
  static async getDocumentAnalytics() {
    // Document stats by category
    const categoryStats = await db
      .select({
        category: documents.category,
        count: count(),
        totalSize: sum(documents.size),
        avgSize: avg(documents.size)
      })
      .from(documents)
      .groupBy(documents.category);

    // Upload trends
    const uploadTrends = await db
      .select({
        date: sql<string>`date_trunc('day', ${documents.uploadedAt})`,
        count: count(),
        totalSize: sum(documents.size)
      })
      .from(documents)
      .where(gte(documents.uploadedAt, sql`current_date - interval '30 days'`))
      .groupBy(sql`date_trunc('day', ${documents.uploadedAt})`)
      .orderBy(sql`date_trunc('day', ${documents.uploadedAt})`);

    // Top uploaders
    const topUploaders = await db
      .select({
        uploadedBy: documents.uploadedBy,
        userName: users.name,
        count: count(),
        totalSize: sum(documents.size)
      })
      .from(documents)
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .groupBy(documents.uploadedBy, users.name)
      .orderBy(desc(count()))
      .limit(10);

    return {
      categoryDistribution: categoryStats,
      uploadTrends,
      topUploaders,
      summary: {
        totalDocuments: categoryStats.reduce((sum, s) => sum + s.count, 0),
        totalSize: categoryStats.reduce((sum, s) => sum + (s.totalSize || 0), 0)
      }
    };
  }

  /**
   * System health metrics
   */
  static async getSystemHealth() {
    // Database connection test
    const dbTest = await db.execute(sql`SELECT 1 as test`);
    
    // Table row counts
    const tableCounts = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(tenders),
      db.select({ count: count() }).from(documents),
      db.select({ count: count() }).from(financeRequests),
      db.select({ count: count() }).from(aiRecommendations)
    ]);

    // Recent activity
    const recentActivity = await db
      .select({
        entityType: activityLogs.entityType,
        action: activityLogs.action,
        count: count()
      })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, sql`current_timestamp - interval '24 hours'`))
      .groupBy(activityLogs.entityType, activityLogs.action)
      .orderBy(desc(count()));

    return {
      database: {
        connected: dbTest.length > 0,
        latency: Date.now() // This would need actual timing
      },
      tables: {
        users: tableCounts[0][0].count,
        tenders: tableCounts[1][0].count,
        documents: tableCounts[2][0].count,
        financeRequests: tableCounts[3][0].count,
        aiRecommendations: tableCounts[4][0].count
      },
      activity: {
        last24Hours: recentActivity,
        totalActivities: recentActivity.reduce((sum, a) => sum + a.count, 0)
      }
    };
  }

  /**
   * Log activity for audit trail
   */
  static async logActivity(
    userId: string | null,
    entityType: string,
    entityId: string,
    action: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ) {
    try {
      await db.insert(activityLogs).values({
        userId,
        entityType,
        entityId,
        action,
        oldValues,
        newValues,
        metadata
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging shouldn't break the main operation
    }
  }

  /**
   * Cleanup old data
   */
  static async cleanupOldData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Cleanup expired sessions
    await db
      .delete(userSessions)
      .where(lte(userSessions.expiresAt, new Date()));

    // Cleanup old activity logs (keep 90 days)
    await db
      .delete(activityLogs)
      .where(lte(activityLogs.createdAt, ninetyDaysAgo));

    // Archive old analytics data (this would move to a separate table in production)
    const oldAnalytics = await db
      .select()
      .from(analytics)
      .where(lte(analytics.timestamp, ninetyDaysAgo));

    if (oldAnalytics.length > 0) {
      // In a real implementation, you'd move this to an archive table
      console.log(`Would archive ${oldAnalytics.length} old analytics records`);
    }

    return {
      sessionsCleared: true,
      activityLogsCleaned: true,
      analyticsArchived: oldAnalytics.length
    };
  }
}
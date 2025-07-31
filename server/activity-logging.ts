import { db } from './db.js';
import { sql } from 'drizzle-orm';

// Activity logging helper functions
export class ActivityLogger {
  static async logActivity(
    tenderId: string, 
    activityType: string, 
    description: string, 
    createdBy: string,
    details?: any
  ) {
    try {
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at, details)
        VALUES (gen_random_uuid(), ${tenderId}, ${activityType}, ${description}, ${createdBy}, NOW(), ${JSON.stringify(details || {})})
      `);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  static async getActivityLogs(tenderId: string) {
    try {
      const result = await db.execute(sql`
        SELECT al.*, u.name as created_by_name 
        FROM activity_logs al
        LEFT JOIN users u ON al.created_by = u.name OR al.created_by = u.id
        WHERE al.tender_id = ${tenderId}
        ORDER BY al.created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
  }
}

// Activity types constants
export const ACTIVITY_TYPES = {
  TENDER_ASSIGNED: 'tender_assigned',
  TENDER_UPDATED: 'tender_updated',
  TENDER_DELETED: 'tender_deleted',
  STATUS_CHANGED: 'status_changed',
  MARKED_NOT_RELEVANT: 'marked_not_relevant',
  DOCUMENT_UPLOADED: 'document_uploaded',
  COMMENT_ADDED: 'comment_added',
  DEADLINE_EXTENDED: 'deadline_extended'
} as const;
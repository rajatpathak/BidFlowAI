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
      // Enhanced logging with more detailed information
      const detailedDescription = await this.createDetailedDescription(activityType, description, createdBy, details);
      
      await db.execute(sql`
        INSERT INTO activity_logs (id, tender_id, activity_type, description, created_by, created_at, details)
        VALUES (gen_random_uuid(), ${tenderId}, ${activityType}, ${detailedDescription}, ${createdBy}, NOW(), ${JSON.stringify(details || {})})
      `);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  static async createDetailedDescription(activityType: string, description: string, createdBy: string, details?: any): Promise<string> {
    try {
      // Get username from createdBy (could be ID or name)
      const userResult = await db.execute(sql`
        SELECT name FROM users WHERE id = ${createdBy} OR name = ${createdBy} LIMIT 1
      `);
      const userName = userResult[0]?.name || createdBy || 'System User';

      // Create standardized descriptions for all events
      switch (activityType) {
        case 'tender_assigned':
          const assignedToResult = await db.execute(sql`
            SELECT name FROM users WHERE id = ${details?.assignedTo} LIMIT 1
          `);
          const assignedToName = assignedToResult[0]?.name || 'Unknown User';
          return `Tender assigned to ${assignedToName} by ${userName}`;

        case 'assignment_updated':
          return `Assignment updated by ${userName}`;

        case 'assignment_removed':
          return `Assignment removed by ${userName}`;

        case 'tender_deleted':
          return `Tender deleted by ${userName}`;

        case 'marked_not_relevant':
          return `Tender marked as not relevant by ${userName}`;

        case 'excel_upload':
          return `Tender added via Excel by ${userName}`;

        case 'corrigendum_update':
          return `Corrigendum update applied by ${userName}`;

        case 'missed_opportunity':
          return `Tender marked as missed opportunity by System`;

        case 'status_changed':
          return `Status changed by ${userName}`;

        case 'document_uploaded':
          return `Document uploaded by ${userName}`;

        case 'comment_added':
          return `Comment added by ${userName}`;

        case 'deadline_extended':
          return `Deadline extended by ${userName}`;

        case 'tender_created':
          return `Tender created by ${userName}`;

        case 'tender_updated':
          return `Tender updated by ${userName}`;

        case 'bid_submitted':
          return `Bid submitted by ${userName}`;

        case 'finance_request':
          return `Finance request created by ${userName}`;

        case 'approval_granted':
          return `Approval granted by ${userName}`;

        case 'approval_rejected':
          return `Approval rejected by ${userName}`;

        default:
          return `${description} by ${userName}`;
      }
    } catch (error) {
      console.error('Error creating detailed description:', error);
      return `${description} by ${createdBy}`;
    }
  }

  static async getActivityLogs(tenderId: string) {
    try {
      const result = await db.execute(sql`
        SELECT 
          al.id,
          al.tender_id,
          al.activity_type,
          al.description,
          al.created_by,
          al.created_at,
          al.details,
          u.name as created_by_name,
          CASE 
            WHEN al.created_by = 'System' THEN 'System'
            WHEN u.name IS NOT NULL THEN u.name
            ELSE al.created_by
          END as display_name
        FROM activity_logs al
        LEFT JOIN users u ON (al.created_by = u.id OR al.created_by = u.name)
        WHERE al.tender_id = ${tenderId}
        ORDER BY al.created_at DESC
      `);
      
      // Format the results with enhanced information
      return result.map(log => {
        const timestamp = new Date(log.created_at).toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        });
        
        return {
          ...log,
          formattedDate: timestamp,
          actionType: this.getActionTypeDisplay(log.activity_type),
          details: log.details ? JSON.parse(log.details) : {},
          // Enhanced description with timestamp included
          enhancedDescription: `${log.description} on ${timestamp}`
        };
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
  }

  static getActionTypeDisplay(activityType: string): string {
    const actionTypes = {
      'tender_assigned': '👤 Assignment',
      'assignment_updated': '✏️ Assignment Update',
      'assignment_removed': '❌ Assignment Removed',
      'tender_deleted': '🗑️ Deletion',
      'marked_not_relevant': '⚠️ Marked Not Relevant',
      'excel_upload': '📊 Excel Upload',
      'corrigendum_update': '📝 Corrigendum Update',
      'missed_opportunity': '⏰ Missed Opportunity',
      'status_changed': '🔄 Status Change',
      'document_uploaded': '📎 Document Upload',
      'comment_added': '💬 Comment',
      'deadline_extended': '⏱️ Deadline Extension'
    };
    
    return actionTypes[activityType] || '📋 Action';
  }
}

// Activity types constants
export const ACTIVITY_TYPES = {
  TENDER_ASSIGNED: 'tender_assigned',
  TENDER_UPDATED: 'tender_updated',
  TENDER_DELETED: 'tender_deleted',
  TENDER_CREATED: 'tender_created',
  STATUS_CHANGED: 'status_changed',
  MARKED_NOT_RELEVANT: 'marked_not_relevant',
  DOCUMENT_UPLOADED: 'document_uploaded',
  COMMENT_ADDED: 'comment_added',
  DEADLINE_EXTENDED: 'deadline_extended',
  EXCEL_UPLOAD: 'excel_upload',
  CORRIGENDUM_UPDATE: 'corrigendum_update',
  MISSED_OPPORTUNITY: 'missed_opportunity',
  ASSIGNMENT_UPDATED: 'assignment_updated',
  ASSIGNMENT_REMOVED: 'assignment_removed',
  BID_SUBMITTED: 'bid_submitted',
  FINANCE_REQUEST: 'finance_request',
  APPROVAL_GRANTED: 'approval_granted',
  APPROVAL_REJECTED: 'approval_rejected'
} as const;
import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Process expired tenders and move them to missed opportunities
 * This should be called:
 * 1. After each Excel upload to check for deadline updates
 * 2. Periodically to catch newly expired tenders
 */
export async function processMissedOpportunities() {
  try {
    console.log("🔍 Checking for missed opportunities...");
    
    // Find tenders that have passed deadline and are not assigned
    const expiredTenders = await db.execute(sql`
      SELECT id, title, organization, deadline, status
      FROM tenders 
      WHERE deadline < NOW() 
      AND (assigned_to IS NULL OR assigned_to = '')
      AND status = 'active'
    `);
    
    console.log(`Found ${expiredTenders.length} tenders that missed deadline`);
    
    if (expiredTenders.length > 0) {
      // Update status to missed_opportunity
      const result = await db.execute(sql`
        UPDATE tenders 
        SET status = 'missed_opportunity',
            updated_at = NOW()
        WHERE deadline < NOW() 
        AND (assigned_to IS NULL OR assigned_to = '')
        AND status = 'active'
      `);
      
      console.log(`✅ Moved ${result.rowCount} tenders to missed opportunities`);
      
      // Log activity for each missed opportunity
      for (const tender of expiredTenders) {
        await db.execute(sql`
          INSERT INTO activity_logs (tender_id, action, details, created_at)
          VALUES (
            ${tender.id},
            'missed_opportunity',
            ${JSON.stringify({
              reason: 'deadline_expired',
              deadline: tender.deadline,
              previous_status: tender.status,
              new_status: 'missed_opportunity',
              source: 'automated_check'
            })},
            NOW()
          )
        `);
      }
      
      return {
        processed: result.rowCount,
        missedOpportunities: expiredTenders.map(t => ({
          id: t.id,
          title: t.title,
          organization: t.organization,
          deadline: t.deadline
        }))
      };
    }
    
    return { processed: 0, missedOpportunities: [] };
    
  } catch (error) {
    console.error("❌ Error processing missed opportunities:", error);
    throw error;
  }
}

/**
 * Check if a tender's deadline was extended in the new upload
 * If yes, reactivate it from missed_opportunity status
 */
export async function checkDeadlineExtensions(tenderId: string, newDeadline: Date) {
  try {
    // Get current tender info
    const currentTender = await db.execute(sql`
      SELECT deadline, status FROM tenders WHERE id = ${tenderId}
    `);
    
    if (currentTender.length === 0) return false;
    
    const current = currentTender[0];
    const currentDeadline = new Date(current.deadline as string);
    
    // If deadline was extended and tender was missed opportunity
    if (newDeadline > currentDeadline && current.status === 'missed_opportunity') {
      // Reactivate the tender
      await db.execute(sql`
        UPDATE tenders 
        SET status = 'active',
            updated_at = NOW()
        WHERE id = ${tenderId}
      `);
      
      // Log the reactivation
      await db.execute(sql`
        INSERT INTO activity_logs (tender_id, action, details, created_at)
        VALUES (
          ${tenderId},
          'reactivated',
          ${JSON.stringify({
            reason: 'deadline_extended',
            old_deadline: currentDeadline.toISOString(),
            new_deadline: newDeadline.toISOString(),
            previous_status: 'missed_opportunity',
            new_status: 'active',
            source: 'excel_upload'
          })},
          NOW()
        )
      `);
      
      console.log(`🔄 Reactivated tender ${tenderId} due to deadline extension`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking deadline extension:", error);
    return false;
  }
}
import { db } from './db.js';
import { sql } from 'drizzle-orm';

// Create activity logs table for tracking tender activities
async function createActivityLogsTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tender_id VARCHAR(255),
        activity_type VARCHAR(50) NOT NULL,
        description TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Activity logs table created successfully');
  } catch (error) {
    console.error('Error creating activity logs table:', error);
  }
}

createActivityLogsTable();
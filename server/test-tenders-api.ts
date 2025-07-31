// Simple test to verify tender API functionality
import { db } from './db.js';
import { sql } from 'drizzle-orm';

async function testTendersAPI() {
  try {
    console.log('Testing tenders API...');
    
    // Test raw query
    const result = await db.execute(sql`
      SELECT 
        t.id, t.title, t.organization, t.value, t.deadline, t.location,
        t.status, t.source, t.ai_score as aiScore, t.assigned_to as assignedTo,
        t.requirements, t.link, t.created_at as createdAt, t.updated_at as updatedAt,
        u.name as assignedToName
      FROM tenders t 
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.status != 'missed_opportunity'
      LIMIT 5
    `);
    
    console.log(`Found ${result.length} tenders`);
    console.log('Sample tender:', JSON.stringify(result[0], null, 2));
    
    // Test count
    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM tenders WHERE status != 'missed_opportunity'`);
    console.log('Total active tenders:', countResult[0]?.count);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTendersAPI();
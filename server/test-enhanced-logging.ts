// Test script to demonstrate enhanced activity logging with detailed event descriptions
import { ActivityLogger, ACTIVITY_TYPES } from './activity-logging.js';
import { db } from './db.js';
import { sql } from 'drizzle-orm';

async function testEnhancedLogging() {
  console.log('🧪 Testing Enhanced Activity Logging System');
  
  // Get a sample tender ID
  const tenderResult = await db.execute(sql`SELECT id FROM tenders LIMIT 1`);
  if (tenderResult.length === 0) {
    console.log('❌ No tenders found to test with');
    return;
  }
  
  const tenderId = tenderResult[0].id;
  console.log(`📋 Using tender ID: ${tenderId}`);
  
  // Test all activity types with enhanced descriptions
  const testActivities = [
    {
      type: ACTIVITY_TYPES.EXCEL_UPLOAD,
      description: 'Excel upload test',
      createdBy: 'System Administrator',
      details: { fileName: 'Tenders-2025-07-31.xlsx', tendersAdded: 150, duplicates: 25 }
    },
    {
      type: ACTIVITY_TYPES.TENDER_ASSIGNED,
      description: 'Assignment test',
      createdBy: 'a995d691-ee61-438c-b81f-b62bfbd50da1', // Admin user ID
      details: { assignedTo: 'd7eb51e7-1334-429e-b57c-48a346236eef', priority: 'high', budget: '100000' }
    },
    {
      type: ACTIVITY_TYPES.CORRIGENDUM_UPDATE,
      description: 'Corrigendum test',
      createdBy: 'System',
      details: { updatedFields: ['deadline', 'value'], fileName: 'Corrigendum-2025.xlsx' }
    },
    {
      type: ACTIVITY_TYPES.DOCUMENT_UPLOADED,
      description: 'Document test',
      createdBy: 'd7eb51e7-1334-429e-b57c-48a346236eef', // Rahul Kumar
      details: { fileName: 'Technical_Proposal.pdf', fileSize: '2.5MB' }
    },
    {
      type: ACTIVITY_TYPES.MISSED_OPPORTUNITY,
      description: 'Missed opportunity test',
      createdBy: 'System',
      details: { deadline: '2025-07-30' }
    },
    {
      type: ACTIVITY_TYPES.STATUS_CHANGED,
      description: 'Status change test',
      createdBy: 'a995d691-ee61-438c-b81f-b62bfbd50da1',
      details: { oldStatus: 'active', newStatus: 'submitted' }
    }
  ];
  
  console.log('\n📝 Creating test activity logs...');
  
  for (const activity of testActivities) {
    try {
      await ActivityLogger.logActivity(
        tenderId,
        activity.type,
        activity.description,
        activity.createdBy,
        activity.details
      );
      console.log(`✅ Created: ${activity.type}`);
    } catch (error) {
      console.error(`❌ Failed to create ${activity.type}:`, error);
    }
  }
  
  // Fetch and display the enhanced activity logs
  console.log('\n📊 Fetching enhanced activity logs...');
  
  const logs = await ActivityLogger.getActivityLogs(tenderId);
  
  console.log(`\n📋 Activity Log Examples (${logs.length} total):`);
  console.log('=' .repeat(80));
  
  logs.slice(0, 6).forEach((log, index) => {
    console.log(`${index + 1}. ${log.enhancedDescription || log.description}`);
    console.log(`   Type: ${log.actionType}`);
    console.log(`   User: ${log.display_name || log.created_by}`);
    console.log('   ' + '-'.repeat(70));
  });
  
  console.log('\n✅ Enhanced Activity Logging Test Complete!');
  console.log('\nExpected Format Examples:');
  console.log('• Tender added via Excel on Jul 31, 2025 21:25 by System Administrator');
  console.log('• Tender assigned to Rahul Kumar on Jul 31, 2025 21:25 by System Administrator');  
  console.log('• Corrigendum update applied on Jul 31, 2025 21:25 by System');
  console.log('• Document uploaded on Jul 31, 2025 21:25 by Rahul Kumar');
  console.log('• Tender marked as missed opportunity on Jul 31, 2025 21:25 by System');
}

testEnhancedLogging().catch(console.error);
import { db } from './db.js';
import { users, tenders, companySettings } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Create sample users
    const sampleUsers = [
      {
        username: 'admin',
        password: 'admin123',
        email: 'admin@company.com',
        name: 'System Administrator',
        role: 'admin',
      },
      {
        username: 'finance',
        password: 'finance123',
        email: 'finance@company.com',
        name: 'Finance Manager',
        role: 'finance_manager',
      },
      {
        username: 'bidder',
        password: 'bidder123',
        email: 'bidder@company.com',
        name: 'Senior Bidder',
        role: 'senior_bidder',
      }
    ];

    // Insert users (check if exists first)
    for (const user of sampleUsers) {
      try {
        const existingUser = await db.select().from(users).where(eq(users.username, user.username)).limit(1);
        if (existingUser.length === 0) {
          await db.insert(users).values(user);
          console.log(`✅ Created user: ${user.username}`);
        } else {
          console.log(`👤 User already exists: ${user.username}`);
        }
      } catch (error) {
        console.log(`❌ Error creating user ${user.username}:`, error);
      }
    }

    // Create company settings
    const companyData = {
      companyName: 'Appentus Technologies',
      turnoverCriteria: '5 cr',
      headquarters: 'Bangalore, India',
      establishedYear: 2010,
      certifications: ['ISO 9001:2015', 'ISO 27001:2013'],
      businessSectors: ['Information Technology', 'Software Development'],
      projectTypes: ['mobile', 'web', 'software', 'infrastructure'],
      updatedBy: 'admin'
    };

    try {
      const existingSettings = await db.select().from(companySettings).limit(1);
      if (existingSettings.length === 0) {
        await db.insert(companySettings).values(companyData);
        console.log('✅ Created company settings');
      }
    } catch (error) {
      console.log('❌ Error creating company settings:', error);
    }

    // Create sample tenders
    const sampleTenders = [
      {
        title: 'Development of Mobile Application for Tax Collection',
        organization: 'Government of Karnataka',
        description: 'Development and implementation of mobile application for property tax collection',
        value: 50000000, // 5 lakh in cents
        deadline: new Date('2025-02-15'),
        status: 'active',
        source: 'gem',
        aiScore: 85,
        location: 'Bangalore',
        referenceNo: 'GOK/IT/2025/001'
      },
      {
        title: 'Web Portal Development for Citizen Services',
        organization: 'Municipal Corporation',
        description: 'Development of citizen services web portal with online payment integration',
        value: 75000000, // 7.5 lakh in cents
        deadline: new Date('2025-03-01'),
        status: 'active',
        source: 'non_gem',
        aiScore: 92,
        location: 'Mumbai',
        referenceNo: 'MC/WEB/2025/002'
      },
      {
        title: 'Software Maintenance and Support Services',
        organization: 'State Bank of India',
        description: 'Annual maintenance contract for existing banking software applications',
        value: 25000000, // 2.5 lakh in cents
        deadline: new Date('2025-01-31'),
        status: 'active',
        source: 'gem',
        aiScore: 78,
        location: 'Delhi',
        referenceNo: 'SBI/IT/2025/003'
      }
    ];

    // Insert tenders (check if exists first)
    for (const tender of sampleTenders) {
      try {
        const existingTender = await db.select().from(tenders).where(eq(tenders.referenceNo, tender.referenceNo)).limit(1);
        if (existingTender.length === 0) {
          await db.insert(tenders).values(tender);
          console.log(`✅ Created tender: ${tender.referenceNo}`);
        }
      } catch (error) {
        console.log(`❌ Error creating tender ${tender.referenceNo}:`, error);
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log('👤 Sample users created:');
    console.log('   - admin/admin123 (Administrator)');
    console.log('   - finance/finance123 (Finance Manager)');
    console.log('   - bidder/bidder123 (Senior Bidder)');
    console.log('📋 Sample tenders created: 3 active tenders');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}
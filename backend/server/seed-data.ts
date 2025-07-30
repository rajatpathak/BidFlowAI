import { db } from './db.js';
import { users, tenders, companySettings } from '../../shared/schema.js';

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Create sample users
    const sampleUsers = [
      {
        id: '1',
        username: 'admin',
        password: 'admin123',
        email: 'admin@company.com',
        fullName: 'System Administrator',
        role: 'admin',
        department: 'IT',
        isActive: true,
      },
      {
        id: '2',
        username: 'finance',
        password: 'finance123',
        email: 'finance@company.com',
        fullName: 'Finance Manager',
        role: 'finance_manager',
        department: 'Finance',
        isActive: true,
      },
      {
        id: '3',
        username: 'bidder',
        password: 'bidder123',
        email: 'bidder@company.com',
        fullName: 'Senior Bidder',
        role: 'senior_bidder',
        department: 'Sales',
        isActive: true,
      }
    ];

    // Insert users (ignore duplicates)
    for (const user of sampleUsers) {
      try {
        await db.insert(users).values(user).ignore();
      } catch (error) {
        // User might already exist, continue
      }
    }

    // Create company settings
    const companyData = {
      id: '1',
      companyName: 'Appentus Technologies',
      turnoverCriteria: '5 cr',
      headquarters: 'Bangalore, India',
      establishedYear: 2010,
      certifications: ['ISO 9001:2015', 'ISO 27001:2013'],
      businessSectors: ['Information Technology', 'Software Development'],
      projectTypes: ['mobile', 'web', 'software', 'infrastructure'],
      updatedBy: '1'
    };

    try {
      await db.insert(companySettings).values(companyData).ignore();
    } catch (error) {
      // Settings might already exist
    }

    // Create sample tenders
    const sampleTenders = [
      {
        id: '1',
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
        id: '2',
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
        id: '3',
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

    // Insert tenders (ignore duplicates)
    for (const tender of sampleTenders) {
      try {
        await db.insert(tenders).values(tender).ignore();
      } catch (error) {
        // Tender might already exist, continue
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
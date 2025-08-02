import { db } from '../server/db.js';
import { 
  users, 
  roles, 
  departments, 
  userRoles,
  companySettings,
  tenders,
  documentTemplates,
  bidDocumentTypes
} from '../shared/schema.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Check if roles already exist
    const existingRoles = await db.select().from(roles);
    console.log(`Found ${existingRoles.length} existing roles`);
    
    let adminRoleId = uuidv4();
    let managerRoleId = uuidv4();
    let bidderRoleId = uuidv4();
    let viewerRoleId = uuidv4();

    if (existingRoles.length === 0) {
      // Create default roles
      console.log('Creating default roles...');
      await db.insert(roles).values([
      {
        id: adminRoleId,
        name: 'Admin',
        description: 'Full system access and user management',
        permissions: JSON.stringify([
          'manage_users', 'manage_tenders', 'manage_documents', 
          'view_analytics', 'manage_settings', 'manage_finance',
          'approve_requests', 'manage_workflows'
        ]),
        createdAt: new Date()
      },
      {
        id: managerRoleId,
        name: 'Manager',
        description: 'Tender management and team oversight',
        permissions: JSON.stringify([
          'manage_tenders', 'view_analytics', 'assign_tenders',
          'approve_documents', 'manage_team'
        ]),
        createdAt: new Date()
      },
      {
        id: bidderRoleId,
        name: 'Bidder',
        description: 'Create and submit bids, manage documents',
        permissions: JSON.stringify([
          'create_tenders', 'manage_documents', 'submit_bids',
          'view_assigned_tenders'
        ]),
        createdAt: new Date()
      },
      {
        id: viewerRoleId,
        name: 'Viewer',
        description: 'Read-only access to tenders and documents',
        permissions: JSON.stringify([
          'view_tenders', 'view_documents'
        ]),
        createdAt: new Date()
      }
    ]);
    } else {
      console.log('Roles already exist, using existing ones...');
      // Get existing role IDs
      const adminRole = existingRoles.find(r => r.name === 'Admin');
      const managerRole = existingRoles.find(r => r.name === 'Manager');
      const bidderRole = existingRoles.find(r => r.name === 'Bidder');
      const viewerRole = existingRoles.find(r => r.name === 'Viewer');
      
      if (adminRole) adminRoleId = adminRole.id;
      if (managerRole) managerRoleId = managerRole.id;
      if (bidderRole) bidderRoleId = bidderRole.id;
      if (viewerRole) viewerRoleId = viewerRole.id;
    }

    // Check if departments already exist
    const existingDepartments = await db.select().from(departments);
    console.log(`Found ${existingDepartments.length} existing departments`);
    
    let procurementDeptId = uuidv4();
    let technicalDeptId = uuidv4();
    let financeDeptId = uuidv4();
    let legalDeptId = uuidv4();

    if (existingDepartments.length === 0) {
      // Create default departments
      console.log('Creating default departments...');
    const procurementDeptId = uuidv4();
    const technicalDeptId = uuidv4();
    const financeDeptId = uuidv4();
    const legalDeptId = uuidv4();

    await db.insert(departments).values([
      {
        id: procurementDeptId,
        name: 'Procurement',
        description: 'Tender procurement and vendor management',
        createdAt: new Date()
      },
      {
        id: technicalDeptId,
        name: 'Technical',
        description: 'Technical evaluation and compliance',
        createdAt: new Date()
      },
      {
        id: financeDeptId,
        name: 'Finance',
        description: 'Financial evaluation and budget management',
        createdAt: new Date()
      },
      {
        id: legalDeptId,
        name: 'Legal',
        description: 'Legal compliance and contract management',
        createdAt: new Date()
      }
    ]);
    } else {
      console.log('Departments already exist, using existing ones...');
      // Get existing department IDs
      const procurementDept = existingDepartments.find(d => d.name === 'Procurement');
      const technicalDept = existingDepartments.find(d => d.name === 'Technical');
      const financeDept = existingDepartments.find(d => d.name === 'Finance');
      const legalDept = existingDepartments.find(d => d.name === 'Legal');
      
      if (procurementDept) procurementDeptId = procurementDept.id;
      if (technicalDept) technicalDeptId = technicalDept.id;
      if (financeDept) financeDeptId = financeDept.id;
      if (legalDept) legalDeptId = legalDept.id;
    }

    // Check if admin user already exists
    const existingUsers = await db.select().from(users);
    const adminUser = existingUsers.find(u => u.username === 'admin');
    
    let adminUserId = uuidv4();
    
    if (!adminUser) {
      // Create default admin user
      console.log('Creating default admin user...');
    const adminUserId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await db.insert(users).values([
      {
        id: adminUserId,
        username: 'admin',
        email: 'admin@bms.local',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
        createdAt: new Date()
      }
    ]);

    // Assign admin role to admin user
    await db.insert(userRoles).values([
      {
        id: uuidv4(),
        userId: adminUserId,
        roleId: adminRoleId,
        assignedAt: new Date(),
        assignedBy: adminUserId
      }
    ]);
    } else {
      console.log('Admin user already exists...');
      adminUserId = adminUser.id;
    }

    // Create additional sample users (only if they don't exist)
    console.log('Creating sample users...');
    const managerUserId = uuidv4();
    const bidderUserId = uuidv4();
    const viewerUserId = uuidv4();

    const managerPassword = await bcrypt.hash('manager123', 10);
    const bidderPassword = await bcrypt.hash('bidder123', 10);
    const viewerPassword = await bcrypt.hash('viewer123', 10);

    // Only create users if they don't exist
    const managerExists = existingUsers.find(u => u.username === 'manager');
    const bidderExists = existingUsers.find(u => u.username === 'bidder');
    const viewerExists = existingUsers.find(u => u.username === 'viewer');

    const usersToCreate = [];
    if (!managerExists) usersToCreate.push({
        id: managerUserId,
        username: 'manager',
        email: 'manager@bms.local',
        password: managerPassword,
        name: 'John Manager',
        role: 'manager',
        createdAt: new Date()
      });
    if (!bidderExists) usersToCreate.push({
        id: bidderUserId,
        username: 'bidder',
        email: 'bidder@bms.local',
        password: bidderPassword,
        name: 'Sarah Bidder',
        role: 'bidder',
        createdAt: new Date()
      });
    if (!viewerExists) usersToCreate.push({
        id: viewerUserId,
        username: 'viewer',
        email: 'viewer@bms.local',
        password: viewerPassword,
        name: 'Mike Viewer',
        role: 'viewer',
        createdAt: new Date()
      });

    if (usersToCreate.length > 0) {
      await db.insert(users).values(usersToCreate);
    }

    // Update IDs for existing users
    if (managerExists) managerUserId = managerExists.id;
    if (bidderExists) bidderUserId = bidderExists.id;
    if (viewerExists) viewerUserId = viewerExists.id;
    // Assign roles to users (only if not already assigned)
    const existingUserRoles = await db.select().from(userRoles);
    const rolesToAssign = [];
    
    if (!existingUserRoles.find(ur => ur.userId === managerUserId && ur.roleId === managerRoleId)) {
      rolesToAssign.push({
        id: uuidv4(),
        userId: managerUserId,
        roleId: managerRoleId,
        assignedAt: new Date(),
        assignedBy: adminUserId
      });
    }
    if (!existingUserRoles.find(ur => ur.userId === bidderUserId && ur.roleId === bidderRoleId)) {
      rolesToAssign.push({
        id: uuidv4(),
        userId: bidderUserId,
        roleId: bidderRoleId,
        assignedAt: new Date(),
        assignedBy: adminUserId
      });
    }
    if (!existingUserRoles.find(ur => ur.userId === viewerUserId && ur.roleId === viewerRoleId)) {
      rolesToAssign.push({
        id: uuidv4(),
        userId: viewerUserId,
        roleId: viewerRoleId,
        assignedAt: new Date(),
        assignedBy: adminUserId
      });
    }

    if (rolesToAssign.length > 0) {
      await db.insert(userRoles).values(rolesToAssign);
    }
    // Create company settings (only if none exist)
    const existingSettings = await db.select().from(companySettings);
    
    if (existingSettings.length === 0) {
      console.log('Creating company settings...');
    await db.insert(companySettings).values([
      {
        id: uuidv4(),
        companyName: 'BMS Corporation',
        annualTurnover: 500000000, // 5 Crore INR in cents
        headquarters: 'New Delhi, India',
        establishedYear: 2010,
        certifications: JSON.stringify(['ISO 9001:2015', 'ISO 27001:2013']),
        businessSectors: JSON.stringify(['IT Services', 'Infrastructure', 'Consulting']),
        projectTypes: JSON.stringify(['Government', 'Enterprise', 'SME']),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create document repository entries
    console.log('Creating document repository entries...');
    await db.insert(documentRepository).values([
      {
        id: uuidv4(),
        name: 'Company Registration Certificate',
        description: 'Official company registration document',
        filename: 'company_registration.pdf',
        originalName: 'Company Registration Certificate.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        category: 'legal',
        tags: JSON.stringify(['registration', 'legal', 'mandatory']),
        uploadedBy: adminUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'ISO 9001:2015 Certificate',
        description: 'Quality management system certification',
        filename: 'iso_9001_cert.pdf',
        originalName: 'ISO 9001 2015 Certificate.pdf',
        mimeType: 'application/pdf',
        size: 512000,
        category: 'certificates',
        tags: JSON.stringify(['iso', 'quality', 'certification']),
        uploadedBy: adminUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Financial Statement 2024',
        description: 'Audited financial statement for 2024',
        filename: 'financial_2024.pdf',
        originalName: 'Financial Statement 2024.pdf',
        mimeType: 'application/pdf',
        size: 2048000,
        category: 'financial',
        tags: JSON.stringify(['financial', 'audit', '2024']),
        uploadedBy: adminUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create bid document types
    console.log('Creating bid document types...');
    await db.insert(bidDocumentTypes).values([
      {
        id: uuidv4(),
        name: 'Technical Specification',
        description: 'Technical requirements and specifications',
        category: 'standard',
        template: '<h1>Technical Specification</h1><p>Enter technical details...</p>',
        isRequired: true,
        isActive: true,
        createdBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Financial Proposal',
        description: 'Pricing and financial terms',
        category: 'standard',
        template: '<h1>Financial Proposal</h1><p>Enter pricing details...</p>',
        isRequired: true,
        isActive: true,
        createdBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Company Profile',
        description: 'Company information and credentials',
        category: 'standard',
        template: '<h1>Company Profile</h1><p>Enter company information...</p>',
        isRequired: true,
        isActive: true,
        createdBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Experience Certificate',
        description: 'Past project experience and references',
        category: 'custom',
        template: '<h1>Experience Certificate</h1><p>Enter experience details...</p>',
        isRequired: false,
        isActive: true,
        createdBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Compliance Document',
        description: 'Regulatory and compliance certificates',
        category: 'custom',
        template: '<h1>Compliance Document</h1><p>Enter compliance details...</p>',
        isRequired: false,
        isActive: true,
        createdBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create sample tender
    console.log('Creating sample tender...');
    const sampleTenderId = uuidv4();
    await db.insert(tenders).values([
      {
        id: sampleTenderId,
        title: 'IT Infrastructure Modernization Project',
        description: 'Comprehensive IT infrastructure upgrade including servers, networking, and cloud migration services',
        organization: 'Government Technology Department',
        value: 5000000000, // 5 Crore INR in cents
        deadline: new Date('2025-03-15'),
        status: 'draft',
        source: 'non_gem',
        aiScore: 85,
        requirements: JSON.stringify([
          'Server infrastructure setup',
          'Network equipment installation', 
          'Cloud migration services',
          'Implementation support'
        ]),
        documents: JSON.stringify([]),
        assignedTo: 'manager',
        link: 'https://eprocure.gov.in/sample-tender',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n🔑 Default Login Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Manager: manager / manager123');
    console.log('Bidder: bidder / bidder123');
    console.log('Viewer: viewer / viewer123');
    console.log('\n📊 Created:');
    console.log('- 4 Roles (Admin, Manager, Bidder, Viewer)');
    console.log('- 4 Departments (Procurement, Technical, Finance, Legal)');
    console.log('- 4 Users with different access levels');
    console.log('- 5 Company settings');
    console.log('- 3 Document templates');
    console.log('- 5 Bid document types');
    console.log('- 1 Sample tender');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
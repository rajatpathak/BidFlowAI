import { db } from '../server/db.js';
import { 
  users, 
  roles, 
  departments, 
  userRoles,
  companySettings,
  tenders
} from '../shared/schema.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Check if admin user already exists
    const existingUsers = await db.select().from(users);
    const adminUser = existingUsers.find(u => u.username === 'admin');
    
    if (!adminUser) {
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
          role: 'admin'
        }
      ]);

      console.log('✅ Admin user created successfully!');
    } else {
      console.log('Admin user already exists');
    }

    // Create other sample users if they don't exist
    const managerExists = existingUsers.find(u => u.username === 'manager');
    const bidderExists = existingUsers.find(u => u.username === 'bidder');

    if (!managerExists) {
      console.log('Creating manager user...');
      const managerPassword = await bcrypt.hash('manager123', 10);
      await db.insert(users).values([
        {
          id: uuidv4(),
          username: 'manager',
          email: 'manager@bms.local',
          password: managerPassword,
          name: 'John Manager',
          role: 'manager'
        }
      ]);
    }

    if (!bidderExists) {
      console.log('Creating bidder user...');
      const bidderPassword = await bcrypt.hash('bidder123', 10);
      await db.insert(users).values([
        {
          id: uuidv4(),
          username: 'bidder',
          email: 'bidder@bms.local',
          password: bidderPassword,
          name: 'Sarah Bidder',
          role: 'bidder'
        }
      ]);
    }

    // Create a sample tender if none exist
    const existingTenders = await db.select().from(tenders);
    if (existingTenders.length === 0) {
      console.log('Creating sample tender...');
      await db.insert(tenders).values([
        {
          id: uuidv4(),
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
          assignedTo: 'manager'
        }
      ]);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n🔑 Default Login Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Manager: manager / manager123');
    console.log('Bidder: bidder / bidder123');

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
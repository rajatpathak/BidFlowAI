import { db } from './db.js';
import { users } from '../../shared/schema.js';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Try to create the users table
    console.log('📋 Checking users table...');
    const allUsers = await db.select().from(users);
    console.log('👥 Current users:', allUsers);
    
    // Try to insert a test user
    if (allUsers.length === 0) {
      console.log('➕ Inserting test user...');
      await db.insert(users).values({
        username: 'admin',
        password: 'admin123', 
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin'
      });
      console.log('✅ Test user created successfully');
    }
    
    // Verify user was created
    const userCheck = await db.select().from(users);
    console.log('👤 Users after insert:', userCheck);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();
// Quick test of memory storage
import { memoryStorage } from './server/memory-storage.js';

async function testAuth() {
  console.log('🧪 Testing memory storage authentication...');
  
  // Initialize storage
  memoryStorage.initialize();
  
  // Get all users
  const users = await memoryStorage.getAllUsers();
  console.log('👥 Users in storage:', users.map(u => ({ username: u.username, password: u.password, role: u.role })));
  
  // Test finding user
  const adminUser = await memoryStorage.findUserByUsername('admin');
  console.log('🔍 Found admin user:', adminUser ? { username: adminUser.username, password: adminUser.password } : 'NOT FOUND');
  
  // Test password matching
  if (adminUser) {
    console.log('🔐 Password test:', adminUser.password === 'admin123' ? 'MATCH' : 'NO MATCH');
  }
  
  // Test stats
  const stats = await memoryStorage.getStats();
  console.log('📊 Stats:', stats);
}

testAuth().catch(console.error);
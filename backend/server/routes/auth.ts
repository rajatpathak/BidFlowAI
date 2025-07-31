import express from 'express';
import { memoryStorage } from '../memory-storage.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 Login attempt received:`, { username, password: '***' });
    
    if (!username || !password) {
      console.log(`❌ Missing credentials`);
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Initialize storage if not already done
    memoryStorage.initialize();
    
    // Debug: List all users
    const allUsers = await memoryStorage.getAllUsers();
    // Find user by username
    const user = await memoryStorage.findUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        debug: 'User not found'
      });
    }
    
    // In production, use proper password hashing (bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        debug: 'Password mismatch'
      });
    }

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    
    console.log(`✅ Login successful for: ${username}`);
    res.json({
      success: true,
      user: userWithoutPassword,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

export default router;
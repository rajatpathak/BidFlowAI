import express from 'express';
import { eq } from 'drizzle-orm';
import { users } from '../../../shared/schema.js';
import { db } from '../db.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (!user.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const foundUser = user[0];
    
    // In production, use proper password hashing (bcrypt)
    if (foundUser.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = foundUser;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

export default router;
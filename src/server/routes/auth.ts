import express from 'express';
import { db } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { generateToken } from '../utils/auth.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Username and password are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // Find user by username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Simple demo authentication
    const demoCredentials: Record<string, string> = {
      'admin': 'admin123',
      'senior_bidder': 'bidder123',  
      'finance_manager': 'finance123'
    };

    if (demoCredentials[username] !== password) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS' 
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

// Get current user
router.get('/user', async (req, res) => {
  try {
    // For demo, return a default admin user
    const defaultUser = {
      id: 'admin-user-id',
      username: 'admin',
      email: 'admin@company.com',
      role: 'admin',
      name: 'Administrator'
    };

    res.json(defaultUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
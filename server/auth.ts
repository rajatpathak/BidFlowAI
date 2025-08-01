import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { users, userSessions } from '../shared/schema.js';
import { eq, and, gte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    name: string;
  };
}

// Generate session token and store in database
export async function generateSessionToken(user: any): Promise<string> {
  const sessionId = uuidv4();
  const token = jwt.sign(
    {
      sessionId,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Store session in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  await db.insert(userSessions).values({
    id: sessionId,
    userId: user.id,
    token,
    expiresAt,
  });

  return token;
}

// Legacy function for backward compatibility
export function generateToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Logout function to invalidate session
export async function invalidateSession(token: string): Promise<void> {
  try {
    await db
      .delete(userSessions)
      .where(eq(userSessions.token, token));
  } catch (error) {
    console.error('Error invalidating session:', error);
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await db
      .delete(userSessions)
      .where(gte(new Date(), userSessions.expiresAt));
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

// Authentication middleware with database session validation
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    
    // Validate session exists in database and hasn't expired
    const [session] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.token, token),
          gte(userSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      res.status(401).json({ message: 'Invalid or expired session' });
      return;
    }

    // Update last accessed timestamp
    await db
      .update(userSessions)
      .set({ lastAccessed: new Date() })
      .where(eq(userSessions.id, session.id));
    
    // Fetch fresh user data from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email || '',
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);

      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email || '',
          role: user.role,
          name: user.name,
        };
      }
    } catch (error) {
      // Ignore token errors for optional auth
      console.log('Optional auth token error:', error);
    }
  }

  next();
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
}
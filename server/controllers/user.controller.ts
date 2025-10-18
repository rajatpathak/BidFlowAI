import { Request, Response } from 'express';
import { db } from '../db.js';
import { users, userRoles, roles } from '../../shared/schema.js';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../auth.js';
import { registerSchema } from '../validation.js';

export class UserController {
  /**
   * Get all users with role information
   */
  static async getUsers(req: Request, res: Response) {
    try {
      const { role, page = '1', limit = '20', search } = req.query;
      
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      let query = db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt,
          roleName: roles.name,
          roleDescription: roles.description
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id));

      // Apply filters
      const conditions = [];
      if (role) conditions.push(eq(users.role, role as string));
      if (search) {
        conditions.push(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.username, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query
        .orderBy(desc(users.createdAt))
        .limit(parseInt(limit as string))
        .offset(offset);

      // Get total count
      const totalQuery = db.select({ count: sql<number>`count(*)` }).from(users);
      if (conditions.length > 0) {
        totalQuery.where(and(...conditions));
      }
      const [{ count: total }] = await totalQuery;

      res.json({
        data: results,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.id, id));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create new user
   */
  static async createUser(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.username, validatedData.username),
            eq(users.email, validatedData.email)
          )
        )
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ 
          error: 'User already exists',
          details: 'Username or email is already registered'
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      const [newUser] = await db
        .insert(users)
        .values({
          ...validatedData,
          password: hashedPassword
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt
        });

      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, role, password } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (password) updateData.password = await hashPassword(password);

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt
        });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ 
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.delete(users).where(eq(users.id, id));
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Current password and new password are required' 
        });
      }

      // Get user with password
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await db
        .update(users)
        .set({ password: hashedNewPassword })
        .where(eq(users.id, id));

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ 
        error: 'Failed to change password',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      // This would typically include activity from various tables
      // For now, we'll return a basic structure
      const activity = {
        tendersAssigned: 0,
        tendersCompleted: 0,
        documentsUploaded: 0,
        lastLoginAt: null,
        activePeriod: {
          start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString()
        }
      };

      res.json(activity);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
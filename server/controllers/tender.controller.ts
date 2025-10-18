import { Request, Response } from 'express';
import { db } from '../db.js';
import { tenders, tenderAssignments, users } from '../../shared/schema.js';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import { validateRequest } from '../validation.js';
import { createTenderSchema, updateTenderSchema, assignTenderSchema } from '../validation.js';

export class TenderController {
  /**
   * Get all tenders with optional filtering and pagination
   */
  static async getTenders(req: Request, res: Response) {
    try {
      const { 
        status, 
        source, 
        assignedTo, 
        page = '1', 
        limit = '50',
        search,
        sortBy = 'deadline',
        sortOrder = 'asc'
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      let query = db.select().from(tenders);
      
      // Apply filters
      const conditions = [];
      if (status) conditions.push(eq(tenders.status, status as string));
      if (source) conditions.push(eq(tenders.source, source as string));
      if (assignedTo) conditions.push(eq(tenders.assignedTo, assignedTo as string));
      if (search) {
        conditions.push(
          or(
            ilike(tenders.title, `%${search}%`),
            ilike(tenders.organization, `%${search}%`),
            ilike(tenders.description, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = sortBy === 'deadline' ? tenders.deadline : 
                        sortBy === 'value' ? tenders.value :
                        sortBy === 'createdAt' ? tenders.createdAt : tenders.deadline;
      
      query = sortOrder === 'desc' ? 
        query.orderBy(desc(sortColumn)) : 
        query.orderBy(sortColumn);

      // Apply pagination
      const results = await query.limit(parseInt(limit as string)).offset(offset);
      
      // Get total count for pagination
      const totalQuery = db.select({ count: sql<number>`count(*)` }).from(tenders);
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
      console.error('Error fetching tenders:', error);
      res.status(500).json({ 
        error: 'Failed to fetch tenders',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get tender by ID with related data
   */
  static async getTenderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Get tender with assignments
      const [tender] = await db
        .select({
          ...tenders,
          assignedUserName: users.name,
          assignedUserEmail: users.email
        })
        .from(tenders)
        .leftJoin(users, eq(tenders.assignedTo, users.username))
        .where(eq(tenders.id, id));

      if (!tender) {
        return res.status(404).json({ error: 'Tender not found' });
      }

      res.json(tender);
    } catch (error) {
      console.error('Error fetching tender:', error);
      res.status(500).json({ 
        error: 'Failed to fetch tender',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create new tender
   */
  static async createTender(req: Request, res: Response) {
    try {
      const validatedData = createTenderSchema.parse(req.body);
      
      const [newTender] = await db
        .insert(tenders)
        .values({
          ...validatedData,
          deadline: new Date(validatedData.deadline),
        })
        .returning();

      res.status(201).json(newTender);
    } catch (error) {
      console.error('Error creating tender:', error);
      res.status(500).json({ 
        error: 'Failed to create tender',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update tender
   */
  static async updateTender(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateTenderSchema.parse(req.body);

      const updateData: any = { ...validatedData, updatedAt: new Date() };
      if (validatedData.deadline) {
        updateData.deadline = new Date(validatedData.deadline);
      }

      const [updatedTender] = await db
        .update(tenders)
        .set(updateData)
        .where(eq(tenders.id, id))
        .returning();

      if (!updatedTender) {
        return res.status(404).json({ error: 'Tender not found' });
      }

      res.json(updatedTender);
    } catch (error) {
      console.error('Error updating tender:', error);
      res.status(500).json({ 
        error: 'Failed to update tender',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete tender
   */
  static async deleteTender(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await db.delete(tenders).where(eq(tenders.id, id));
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Tender not found' });
      }

      res.json({ message: 'Tender deleted successfully' });
    } catch (error) {
      console.error('Error deleting tender:', error);
      res.status(500).json({ 
        error: 'Failed to delete tender',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Assign tender to user
   */
  static async assignTender(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = assignTenderSchema.parse(req.body);

      // Update tender assignment
      const [updatedTender] = await db
        .update(tenders)
        .set({
          assignedTo: validatedData.assignedTo,
          updatedAt: new Date()
        })
        .where(eq(tenders.id, id))
        .returning();

      if (!updatedTender) {
        return res.status(404).json({ error: 'Tender not found' });
      }

      // Create assignment record
      await db.insert(tenderAssignments).values({
        tenderId: id,
        assignedTo: validatedData.assignedTo,
        priority: validatedData.priority,
        budget: validatedData.budget,
        notes: validatedData.notes,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        status: 'assigned'
      });

      res.json(updatedTender);
    } catch (error) {
      console.error('Error assigning tender:', error);
      res.status(500).json({ 
        error: 'Failed to assign tender',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get tender statistics
   */
  static async getTenderStats(req: Request, res: Response) {
    try {
      const stats = await db
        .select({
          status: tenders.status,
          source: tenders.source,
          count: sql<number>`count(*)`,
          totalValue: sql<number>`sum(${tenders.value})`,
          avgValue: sql<number>`avg(${tenders.value})`
        })
        .from(tenders)
        .groupBy(tenders.status, tenders.source);

      const summary = {
        total: 0,
        byStatus: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        totalValue: 0,
        averageValue: 0
      };

      stats.forEach(stat => {
        summary.total += stat.count;
        summary.byStatus[stat.status] = (summary.byStatus[stat.status] || 0) + stat.count;
        summary.bySource[stat.source] = (summary.bySource[stat.source] || 0) + stat.count;
        summary.totalValue += stat.totalValue || 0;
      });

      summary.averageValue = summary.total > 0 ? summary.totalValue / summary.total : 0;

      res.json({ stats, summary });
    } catch (error) {
      console.error('Error fetching tender stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
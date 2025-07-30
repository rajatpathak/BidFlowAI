import express from 'express';
import { eq, like, and, or, sql } from 'drizzle-orm';
import { tenders } from '../../../shared/schema.js';
import { db } from '../db.js';

const router = express.Router();

// Get all tenders with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      source, 
      status, 
      organization,
      deadline,
      eligibility,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = db.select().from(tenders);
    let conditions: any[] = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(tenders.title, `%${search}%`),
          like(tenders.organization, `%${search}%`),
          like(tenders.description, `%${search}%`)
        )
      );
    }

    // Source filter (GEM/Non-GEM)
    if (source && source !== 'all') {
      conditions.push(eq(tenders.source, source as string));
    }

    // Status filter
    if (status && status !== 'all') {
      conditions.push(eq(tenders.status, status as string));
    }

    // Organization filter
    if (organization && organization !== 'all') {
      conditions.push(eq(tenders.organization, organization as string));
    }

    // Deadline filter
    if (deadline) {
      const now = new Date();
      let deadlineCondition;
      
      switch (deadline) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          deadlineCondition = and(
            sql`${tenders.deadline} >= ${today}`,
            sql`${tenders.deadline} < ${tomorrow}`
          );
          break;
        case 'week':
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          deadlineCondition = and(
            sql`${tenders.deadline} >= ${now}`,
            sql`${tenders.deadline} <= ${weekFromNow}`
          );
          break;
        case 'month':
          const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          deadlineCondition = and(
            sql`${tenders.deadline} >= ${now}`,
            sql`${tenders.deadline} <= ${monthFromNow}`
          );
          break;
        case 'overdue':
          deadlineCondition = sql`${tenders.deadline} < ${now}`;
          break;
      }
      
      if (deadlineCondition) {
        conditions.push(deadlineCondition);
      }
    }

    // Eligibility filter
    if (eligibility && eligibility !== 'all') {
      if (eligibility === 'eligible') {
        conditions.push(sql`${tenders.aiScore} >= 70`);
      } else if (eligibility === 'not_eligible') {
        conditions.push(sql`${tenders.aiScore} < 70`);
      }
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    query = query.limit(limitNum).offset(offset);

    // Execute query
    const results = await query;

    // Get total count for pagination
    let countQuery = db.select({ count: sql`count(*)` }).from(tenders);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count }] = await countQuery;

    res.json({
      tenders: results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get tenders error:', error);
    res.status(500).json({ error: 'Failed to fetch tenders' });
  }
});

// Get single tender
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.select().from(tenders).where(eq(tenders.id, id)).limit(1);
    
    if (!result.length) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Get tender error:', error);
    res.status(500).json({ error: 'Failed to fetch tender' });
  }
});

// Create new tender
router.post('/', async (req, res) => {
  try {
    const tenderData = req.body;
    
    const result = await db.insert(tenders).values(tenderData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Tender created successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Create tender error:', error);
    res.status(500).json({ error: 'Failed to create tender' });
  }
});

// Update tender
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    await db.update(tenders).set(updateData).where(eq(tenders.id, id));
    
    res.json({ 
      success: true, 
      message: 'Tender updated successfully' 
    });
  } catch (error) {
    console.error('Update tender error:', error);
    res.status(500).json({ error: 'Failed to update tender' });
  }
});

// Delete tender
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(tenders).where(eq(tenders.id, id));
    
    res.json({ 
      success: true, 
      message: 'Tender deleted successfully' 
    });
  } catch (error) {
    console.error('Delete tender error:', error);
    res.status(500).json({ error: 'Failed to delete tender' });
  }
});

export default router;
import express from 'express';
import { memoryStorage } from '../memory-storage.js';

const router = express.Router();

// Get all tenders with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      source, 
      status, 
      page = 1, 
      limit = 50 
    } = req.query;

    const filters = {
      search: search as string,
      source: source as string,
      status: status as string
    };

    const result = await memoryStorage.getAllTenders(filters);
    
    // Add pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;
    
    const paginatedTenders = result.tenders.slice(offset, offset + limitNum);

    res.json({
      tenders: paginatedTenders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum)
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
    
    const tender = await memoryStorage.getTenderById(id);
    
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    res.json(tender);
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
import express from 'express';
import { db } from '../db.js';
import { tenders, excelUploads } from '../../shared/schema.js';

const router = express.Router();

// Get all tenders
router.get('/', async (req, res) => {
  try {
    const allTenders = await db.select().from(tenders);
    res.json(allTenders);
  } catch (error) {
    console.error('Error fetching tenders:', error);
    res.status(500).json({ error: 'Failed to fetch tenders' });
  }
});

// Get Excel uploads
router.get('/excel-uploads', async (req, res) => {
  try {
    const uploads = await db.select().from(excelUploads);
    res.json(uploads);
  } catch (error) {
    console.error('Error fetching Excel uploads:', error);
    res.status(500).json({ error: 'Failed to fetch Excel uploads' });
  }
});

export default router;
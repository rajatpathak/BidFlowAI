import express from 'express';
import { db } from '../db.js';
import { documentTemplates, companySettings } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Document Templates Routes
router.get('/document-templates', async (req, res) => {
  try {
    const templates = await db.select().from(documentTemplates);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching document templates:', error);
    res.status(500).json({ error: 'Failed to fetch document templates' });
  }
});

router.post('/document-templates', async (req, res) => {
  try {
    const [template] = await db
      .insert(documentTemplates)
      .values(req.body)
      .returning();
    res.json(template);
  } catch (error) {
    console.error('Error creating document template:', error);
    res.status(500).json({ error: 'Failed to create document template' });
  }
});

router.put('/document-templates/:id', async (req, res) => {
  try {
    const [template] = await db
      .update(documentTemplates)
      .set(req.body)
      .where(eq(documentTemplates.id, req.params.id))
      .returning();
    res.json(template);
  } catch (error) {
    console.error('Error updating document template:', error);
    res.status(500).json({ error: 'Failed to update document template' });
  }
});

router.delete('/document-templates/:id', async (req, res) => {
  try {
    await db
      .delete(documentTemplates)
      .where(eq(documentTemplates.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document template:', error);
    res.status(500).json({ error: 'Failed to delete document template' });
  }
});

// Company Settings Routes
router.get('/company-settings', async (req, res) => {
  try {
    const [settings] = await db.select().from(companySettings).limit(1);
    res.json(settings || {});
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

router.post('/company-settings', async (req, res) => {
  try {
    const [settings] = await db
      .insert(companySettings)
      .values(req.body)
      .returning();
    res.json(settings);
  } catch (error) {
    console.error('Error creating company settings:', error);
    res.status(500).json({ error: 'Failed to create company settings' });
  }
});

export default router;
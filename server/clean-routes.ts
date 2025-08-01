import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './db.js';
import { documentTemplates, companySettings, tenders, excelUploads, users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export function registerCleanRoutes(app: express.Application) {
  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));
  
  // API route logging
  app.use('/api/*', (req, res, next) => {
    console.log(`🔄 API Request: ${req.method} ${req.path}`);
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
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

      // Demo authentication
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

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

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

  app.get('/api/auth/user', async (req, res) => {
    try {
      // Return default admin user for demo
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

  // Document Templates Routes
  app.get('/api/document-templates', async (req, res) => {
    try {
      const templates = await db.select().from(documentTemplates);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching document templates:', error);
      res.status(500).json({ error: 'Failed to fetch document templates' });
    }
  });

  app.post('/api/document-templates', async (req, res) => {
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

  app.put('/api/document-templates/:id', async (req, res) => {
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

  app.delete('/api/document-templates/:id', async (req, res) => {
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

  // Image Upload Routes
  app.post('/api/upload-images', upload.array('images'), async (req, res) => {
    try {
      console.log('Upload request received');
      console.log('Files:', req.files);
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        console.log('No files found in request');
        return res.status(400).json({ error: 'No images uploaded' });
      }

      const uploadedImages = req.files.map((file, index) => ({
        id: `img_${Date.now()}_${index}`,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        order: index + 1,
        url: `/uploads/${file.filename}`,
      }));

      console.log('Uploaded images:', uploadedImages);
      res.json(uploadedImages);
    } catch (error) {
      console.error('Error uploading images:', error);
      res.status(500).json({ error: 'Failed to upload images' });
    }
  });

  // Company Settings Routes
  app.get('/api/company-settings', async (req, res) => {
    try {
      const [settings] = await db.select().from(companySettings).limit(1);
      res.json(settings || {});
    } catch (error) {
      console.error('Error fetching company settings:', error);
      res.status(500).json({ error: 'Failed to fetch company settings' });
    }
  });

  app.post('/api/company-settings', async (req, res) => {
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

  // Excel Uploads Routes
  app.get('/api/excel-uploads', async (req, res) => {
    try {
      const uploads = await db.select().from(excelUploads);
      res.json(uploads);
    } catch (error) {
      console.error('Error fetching Excel uploads:', error);
      res.status(500).json({ error: 'Failed to fetch Excel uploads' });
    }
  });

  // Tenders Routes
  app.get('/api/tenders', async (req, res) => {
    try {
      const allTenders = await db.select().from(tenders);
      res.json(allTenders);
    } catch (error) {
      console.error('Error fetching tenders:', error);
      res.status(500).json({ error: 'Failed to fetch tenders' });
    }
  });

  // Bid Document Routes
  app.get('/api/tenders/:tenderId/bid-documents', async (req, res) => {
    try {
      const { tenderId } = req.params;
      
      // For demo, return sample bid documents
      const sampleBidDocuments = [
        {
          id: 'bd1',
          tenderId,
          documentType: 'Technical Proposal',
          title: 'Technical Proposal - Server Infrastructure',
          content: 'Technical proposal content for server infrastructure...',
          status: 'draft',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin'
        },
        {
          id: 'bd2',
          tenderId,
          documentType: 'Commercial Proposal',
          title: 'Commercial Proposal - Pricing Structure',
          content: 'Commercial proposal with detailed pricing...',
          status: 'in-review',
          version: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
          reviewedBy: 'finance_manager',
          comments: 'Please review pricing structure'
        }
      ];
      
      res.json(sampleBidDocuments);
    } catch (error) {
      console.error('Error fetching bid documents:', error);
      res.status(500).json({ error: 'Failed to fetch bid documents' });
    }
  });

  app.post('/api/tenders/:tenderId/bid-documents', async (req, res) => {
    try {
      const { tenderId } = req.params;
      const { documentType, title, content, status } = req.body;
      
      const newBidDocument = {
        id: `bd_${Date.now()}`,
        tenderId,
        documentType,
        title,
        content,
        status: status || 'draft',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin'
      };
      
      console.log('Created bid document:', newBidDocument);
      res.json(newBidDocument);
    } catch (error) {
      console.error('Error creating bid document:', error);
      res.status(500).json({ error: 'Failed to create bid document' });
    }
  });

  app.put('/api/bid-documents/:documentId', async (req, res) => {
    try {
      const { documentId } = req.params;
      const { documentType, title, content } = req.body;
      
      const updatedBidDocument = {
        id: documentId,
        documentType,
        title,
        content,
        status: 'draft',
        version: 2,
        updatedAt: new Date().toISOString()
      };
      
      console.log('Updated bid document:', updatedBidDocument);
      res.json(updatedBidDocument);
    } catch (error) {
      console.error('Error updating bid document:', error);
      res.status(500).json({ error: 'Failed to update bid document' });
    }
  });

  app.delete('/api/bid-documents/:documentId', async (req, res) => {
    try {
      const { documentId } = req.params;
      
      console.log('Deleted bid document:', documentId);
      res.json({ success: true, message: 'Bid document deleted successfully' });
    } catch (error) {
      console.error('Error deleting bid document:', error);
      res.status(500).json({ error: 'Failed to delete bid document' });
    }
  });

  app.get('/api/bid-document-types', async (req, res) => {
    try {
      const documentTypes = [
        { id: 'tech', name: 'Technical Proposal' },
        { id: 'comm', name: 'Commercial Proposal' },
        { id: 'comp', name: 'Compliance Statement' },
        { id: 'exec', name: 'Executive Summary' },
        { id: 'ref', name: 'Reference Letters' },
        { id: 'cert', name: 'Certificates & Qualifications' },
        { id: 'impl', name: 'Implementation Plan' },
        { id: 'support', name: 'Support & Maintenance' }
      ];
      
      res.json(documentTypes);
    } catch (error) {
      console.error('Error fetching document types:', error);
      res.status(500).json({ error: 'Failed to fetch document types' });
    }
  });

  // Catch-all for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });
}
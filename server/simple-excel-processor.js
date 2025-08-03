import fs from 'fs';
import path from 'path';
import { storage } from './storage.js';
import { tenders } from '../shared/schema.js';
import { sql, eq } from 'drizzle-orm';

export async function processSimpleExcelUpload(filePath, originalName, uploadedBy, progressCallback) {
  try {
    console.log(`Processing file: ${filePath}`);
    
    const path = await import('path');
    const fileExtension = path.extname(filePath).toLowerCase();
    
    let lines = [];
    let headers = [];
    
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Use XLSX for Excel files
      const XLSX = await import('xlsx');
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        headers = jsonData[0].map(h => String(h).trim().toLowerCase());
        // Convert rows to lines format
        for (let i = 1; i < jsonData.length; i++) {
          const values = jsonData[i] || [];
          const line = values.map(v => String(v || '').trim()).join(',');
          if (line.trim()) lines.push(line);
        }
      }
    } else {
      // CSV processing
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      lines = fileContent.split('\n').filter(line => line.trim());
      headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      lines = lines.slice(1); // Remove header line
    }
    
    let processed = 0;
    let duplicates = 0;
    let gemAdded = 0;
    let nonGemAdded = 0;
    let errors = 0;
    
    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        // Map values to headers
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Skip empty rows
        if (!row.title && !row.organization) continue;
        
        // Check for duplicates
        const existingTender = await storage.db
          .select()
          .from(tenders)
          .where(sql`title = ${row.title} AND organization = ${row.organization}`)
          .limit(1);
        
        if (existingTender.length > 0) {
          duplicates++;
          continue;
        }
        
        // Insert new tender
        const tenderData = {
          title: row.title || 'Untitled Tender',
          organization: row.organization || 'Unknown Organization',
          description: row.description || null,
          value: parseFloat(row.value) || 0,
          deadline: new Date(row.deadline || Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days from now
          status: row.status || 'active',
          source: row.source || 'manual',
          aiScore: null,
          requirements: {},
          documents: [],
          location: row.location || null,
          category: row.category || null,
          contactEmail: row.contact_email || null,
          contactPhone: row.contact_phone || null,
          publishedDate: new Date(),
          submissionMethod: row.submission_method || 'online'
        };
        
        await storage.db.insert(tenders).values(tenderData);
        
        processed++;
        if (row.source === 'gem') {
          gemAdded++;
        } else {
          nonGemAdded++;
        }
        
        // Send progress update
        if (progressCallback) {
          progressCallback({
            processed,
            duplicates,
            total: lines.length - 1,
            percentage: Math.round((i / (lines.length - 1)) * 100),
            gemAdded,
            nonGemAdded,
            errors
          });
        }
        
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        errors++;
      }
    }
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error deleting uploaded file:', error);
    }
    
    return {
      success: true,
      tendersProcessed: processed,
      duplicatesSkipped: duplicates,
      gemAdded,
      nonGemAdded,
      errorsEncountered: errors,
      totalRows: lines.length - 1
    };
    
  } catch (error) {
    console.error('Excel processing error:', error);
    return {
      success: false,
      error: error.message,
      tendersProcessed: 0,
      duplicatesSkipped: 0,
      errorsEncountered: 1
    };
  }
}
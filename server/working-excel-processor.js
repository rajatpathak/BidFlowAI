import fs from 'fs';
import path from 'path';
import { db } from './db.js';
import { tenders } from '../shared/schema.js';
import { sql, eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function processWorkingExcelUpload(filePath, originalName, uploadedBy, progressCallback) {
  try {
    console.log(`Processing file: ${filePath}`);
    
    const fileExtension = path.extname(filePath).toLowerCase();
    
    let processed = 0;
    let duplicates = 0;
    let gemAdded = 0;
    let nonGemAdded = 0;
    let errors = 0;
    let totalRows = 0;
    
    // For Excel files, try to convert them using a different approach
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      try {
        // Import XLSX dynamically with proper handling
        const { default: XLSX } = await import('xlsx');
        
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('Excel data extracted:', jsonData.length, 'rows');
        
        if (jsonData.length > 1) {
          const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
          totalRows = jsonData.length - 1;
          
          // Process each data row
          for (let i = 1; i < jsonData.length; i++) {
            try {
              const values = jsonData[i] || [];
              const row = {};
              
              // Map values to headers
              headers.forEach((header, index) => {
                row[header] = values[index] ? String(values[index]).trim() : '';
              });
              
              // Skip empty rows
              if (!row.title && !row.organization) continue;
              
              // Check for duplicates
              const existingTender = await db
                .select()
                .from(tenders)
                .where(eq(tenders.title, row.title))
                .limit(1);
              
              if (existingTender.length > 0) {
                duplicates++;
                continue;
              }
              
              // Create tender with database schema fields
              const now = new Date();
              const tenderData = {
                title: String(row.title || 'Untitled Tender'),
                organization: String(row.organization || 'Unknown Organization'),
                description: String(row.description || 'No description available'),
                value: Number(row.value) || 0,
                deadline: row.deadline ? new Date(row.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'draft',
                source: String(row.source).toLowerCase() === 'gem' ? 'gem' : 'non_gem',
                aiScore: Number(row.aiscore || row.ai_score) || 0,
                requirements: row.requirements ? [{ reference: String(row.requirements) }] : [],
                documents: [],
                bidContent: null,
                assignedTo: null,
                link: String(row.link || row.url || '') || null,
                submittedAt: null,
                notRelevantReason: null,
                notRelevantRequestedBy: null,
                notRelevantRequestedAt: null,
                notRelevantApprovedBy: null,
                notRelevantApprovedAt: null,
                notRelevantStatus: 'none'
              };
              
              await db.insert(tenders).values(tenderData);
              
              if (tenderData.source === 'gem') {
                gemAdded++;
              } else {
                nonGemAdded++;
              }
              
              processed++;
              
              // Update progress
              const percentage = Math.round((i / totalRows) * 100);
              const progress = {
                processed,
                duplicates,
                total: totalRows,
                percentage,
                gemAdded,
                nonGemAdded,
                errors
              };
              
              if (progressCallback) {
                progressCallback(progress);
              }
              
            } catch (rowError) {
              console.error('Error processing row:', rowError);
              errors++;
            }
          }
        }
        
      } catch (xlsxError) {
        console.error('Excel processing failed, treating as CSV:', xlsxError);
        // Fallback to CSV processing
        return await processAsCSV(filePath, originalName, uploadedBy, progressCallback);
      }
    } else {
      // Process as CSV
      return await processAsCSV(filePath, originalName, uploadedBy, progressCallback);
    }
    
    const result = {
      success: true,
      processed,
      duplicates,
      total: totalRows,
      gemAdded,
      nonGemAdded,
      errors,
      message: `Processed ${processed} tenders, ${duplicates} duplicates skipped`
    };
    
    console.log('Excel processing completed:', result);
    return result;
    
  } catch (error) {
    console.error('Excel processing error:', error);
    return {
      success: false,
      error: error.message,
      processed: 0,
      duplicates: 0,
      total: 0,
      gemAdded: 0,
      nonGemAdded: 0,
      errors: 1
    };
  }
}

async function processAsCSV(filePath, originalName, uploadedBy, progressCallback) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return {
      success: false,
      error: 'No data found in file',
      processed: 0,
      duplicates: 0,
      total: 0,
      gemAdded: 0,
      nonGemAdded: 0,
      errors: 1
    };
  }
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
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
      const existingTender = await db
        .select()
        .from(tenders)
        .where(eq(tenders.title, row.title))
        .limit(1);
      
      if (existingTender.length > 0) {
        duplicates++;
        continue;
      }
      
      // Create tender with database schema fields
      const now = new Date();
      const tenderData = {
        title: String(row.title || 'Untitled Tender'),
        organization: String(row.organization || 'Unknown Organization'),
        description: String(row.description || 'No description available'),
        value: Number(row.value) || 0,
        deadline: row.deadline ? new Date(row.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        source: String(row.source).toLowerCase() === 'gem' ? 'gem' : 'non_gem',
        aiScore: Number(row.aiscore || row.ai_score) || 0,
        requirements: row.requirements ? [{ reference: String(row.requirements) }] : [],
        documents: [],
        bidContent: null,
        assignedTo: null,
        link: String(row.link || row.url || '') || null,
        submittedAt: null,
        notRelevantReason: null,
        notRelevantRequestedBy: null,
        notRelevantRequestedAt: null,
        notRelevantApprovedBy: null,
        notRelevantApprovedAt: null,
        notRelevantStatus: 'none'
      };
      
      await db.insert(tenders).values(tenderData);
      
      if (tenderData.source === 'gem') {
        gemAdded++;
      } else {
        nonGemAdded++;
      }
      
      processed++;
      
      // Update progress
      const percentage = Math.round((i / (lines.length - 1)) * 100);
      const progress = {
        processed,
        duplicates,
        total: lines.length - 1,
        percentage,
        gemAdded,
        nonGemAdded,
        errors
      };
      
      if (progressCallback) {
        progressCallback(progress);
      }
      
    } catch (rowError) {
      console.error('Error processing row:', rowError);
      errors++;
    }
  }
  
  return {
    success: true,
    processed,
    duplicates,
    total: lines.length - 1,
    gemAdded,
    nonGemAdded,
    errors,
    message: `Processed ${processed} tenders, ${duplicates} duplicates skipped`
  };
}
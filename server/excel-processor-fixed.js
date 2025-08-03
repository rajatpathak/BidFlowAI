import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { db } from './db.js';
import { tenders } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Clean and validate field values
function cleanValue(value, type = 'string', defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  switch (type) {
    case 'string':
      return String(value).trim() || defaultValue;
    case 'number':
      const num = Number(value);
      return isNaN(num) ? (defaultValue || 0) : num;
    case 'date':
      const date = new Date(value);
      return isNaN(date.getTime()) ? defaultValue : date;
    case 'boolean':
      return Boolean(value);
    default:
      return value;
  }
}

export async function processExcelFileFixed(filePath, sessionId, progressCallback) {
  try {
    console.log('🔄 Starting Excel processing with file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // Read Excel file and process all tender sheets
    const workbook = XLSX.readFile(filePath);
    console.log(`📊 Available sheets: ${workbook.SheetNames.join(', ')}`);
    
    let allData = [];
    for (const sheetName of workbook.SheetNames) {
      if (sheetName.toLowerCase().includes('tender')) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet);
        console.log(`📋 Sheet "${sheetName}": ${sheetData.length} rows`);
        
        // Add sheet info to each row
        const dataWithSheet = sheetData.map(row => ({ ...row, _sheetName: sheetName }));
        allData = [...allData, ...dataWithSheet];
      }
    }
    
    const rawData = allData;

    console.log(`📊 Found ${rawData.length} rows in Excel file`);
    
    // Debug: Show first few rows to understand structure
    if (rawData.length > 0) {
      console.log('📋 First row keys:', Object.keys(rawData[0]));
      console.log('📋 Sample data:', rawData[0]);
    }

    let processed = 0;
    let duplicates = 0;
    let gemAdded = 0;
    let nonGemAdded = 0;
    let errors = 0;
    const total = rawData.length;

    // Process each row
    for (let i = 0; i < rawData.length; i++) {
      try {
        const row = rawData[i];
        processed++;

        // Clean and validate all fields with actual Excel field names
        const title = cleanValue(
          row['TENDER BRIEF'] || row.title || row.Title || row.TITLE || 
          row['Tender Title'] || row['tender_title'] || 
          row.name || row.Name || row.tenderTitle,
          'string', 
          `Tender ${i + 1}`
        );
        
        const organization = cleanValue(
          row.Organization || row.organization || row.ORGANIZATION ||
          row['Organization Name'] || row.dept || row.department ||
          row.buyer || row.Buyer || row.ministry,
          'string', 
          'Unknown Organization'
        );
        
        const description = cleanValue(
          row['TENDER BRIEF'] || row.description || row.Description || row.DESCRIPTION ||
          row.details || row.Details || row.summary ||
          row.scope || row.Scope,
          'string', 
          'No description available'
        );
        
        const value = cleanValue(
          row['ESTIMATED COST'] || row.value || row.Value || row.VALUE ||
          row.amount || row.Amount || row.price ||
          row.tender_value || row['Tender Value'] ||
          row.estimated_value,
          'number', 
          0
        );
        
        // Determine source based on sheet name
        const source = (row._sheetName && row._sheetName.toLowerCase().includes('gem')) ? 'gem' : 'non_gem';
        
        const link = cleanValue(
          row.link || row.Link || row.LINK ||
          row.url || row.URL || row.tender_url ||
          row['Tender URL'] || row.web_link,
          'string', 
          ''
        );

        // Handle deadline with actual Excel field names
        let deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days from now
        const deadlineField = row.Deadline || row.deadline || row.DEADLINE ||
                             row.due_date || row['Due Date'] || row.submission_date ||
                             row['Submission Date'] || row.end_date || row['End Date'];
        
        if (deadlineField) {
          const deadlineValue = cleanValue(deadlineField, 'date');
          if (deadlineValue) deadline = deadlineValue;
        }

        // Check for duplicates by title and organization (skip if generic title)
        let existingTender = [];
        if (title !== 'Untitled Tender' && !title.startsWith('Tender ')) {
          existingTender = await db
            .select()
            .from(tenders)
            .where(eq(tenders.title, title))
            .limit(1);
        }

        if (existingTender.length > 0) {
          duplicates++;
          console.log(`⚠️ Duplicate found: ${title}`);
        } else {
          // Create tender object with only valid fields
          const tenderData = {
            title,
            organization,
            description,
            value,
            deadline,
            status: 'draft',
            source: source === 'gem' ? 'gem' : 'non_gem',
            aiScore: cleanValue(row.aiscore || row.ai_score || row.AiScore, 'number', 0),
            requirements: [],
            documents: [],
            bidContent: null,
            assignedTo: null,
            link: link || null,
            submittedAt: null,
            notRelevantReason: null,
            notRelevantRequestedBy: null,
            notRelevantRequestedAt: null,
            notRelevantApprovedBy: null,
            notRelevantApprovedAt: null,
            notRelevantStatus: 'none'
          };

          // Insert tender
          await db.insert(tenders).values(tenderData);

          // Track statistics
          if (source === 'gem') {
            gemAdded++;
          } else {
            nonGemAdded++;
          }

          console.log(`✅ Added tender: ${title} (${source})`);
        }

        // Send progress update
        const percentage = Math.round((processed / total) * 100);
        const progress = {
          processed,
          duplicates,
          total,
          percentage,
          gemAdded,
          nonGemAdded,
          errors,
          completed: processed === total
        };

        if (progressCallback) {
          try {
            progressCallback(progress);
          } catch (callbackError) {
            console.warn('Progress callback error:', callbackError.message);
          }
        }

        // Small delay to prevent overwhelming the system
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`❌ Error processing row ${i + 1}:`, error.message);
        errors++;
      }
    }

    // Final progress update
    const finalProgress = {
      processed,
      duplicates,
      total,
      percentage: 100,
      gemAdded,
      nonGemAdded,
      errors,
      completed: true
    };

    if (progressCallback) {
      try {
        progressCallback(finalProgress);
      } catch (callbackError) {
        console.warn('Final progress callback error:', callbackError.message);
      }
    }

    console.log(`🎉 Processing complete: ${gemAdded} GeM, ${nonGemAdded} Non-GeM, ${duplicates} duplicates, ${errors} errors`);

    return {
      success: true,
      message: `Successfully processed ${processed} rows. Added ${gemAdded + nonGemAdded} tenders.`,
      stats: finalProgress
    };

  } catch (error) {
    console.error('💥 Excel processing failed:', error);
    throw error;
  }
}
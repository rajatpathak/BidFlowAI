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

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Found ${rawData.length} rows in Excel file`);

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

        // Clean and validate all fields
        const title = cleanValue(row.title || row.Title || row.TITLE, 'string', 'Untitled Tender');
        const organization = cleanValue(row.organization || row.Organization || row.ORGANIZATION, 'string', 'Unknown Organization');
        const description = cleanValue(row.description || row.Description || row.DESCRIPTION, 'string', 'No description available');
        const value = cleanValue(row.value || row.Value || row.VALUE, 'number', 0);
        const source = cleanValue(row.source || row.Source || row.SOURCE, 'string', 'non_gem').toLowerCase();
        const link = cleanValue(row.link || row.Link || row.LINK || row.url || row.URL, 'string', '');

        // Handle deadline
        let deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days from now
        if (row.deadline || row.Deadline || row.DEADLINE) {
          const deadlineValue = cleanValue(row.deadline || row.Deadline || row.DEADLINE, 'date');
          if (deadlineValue) deadline = deadlineValue;
        }

        // Check for duplicates by title and organization
        const existingTender = await db
          .select()
          .from(tenders)
          .where(eq(tenders.title, title))
          .limit(1);

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
          progressCallback(progress);
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
      progressCallback(finalProgress);
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
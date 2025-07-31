import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { db } from './db.js';
import { tenders, enhancedTenderResults, excelUploads, tenderResultsImports } from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';

// Simple, robust tender upload processing
export async function processActiveTenderExcel(filePath: string, fileName: string, uploadedBy: string) {
  try {
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    let totalProcessed = 0;
    let totalDuplicates = 0;

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (!data || data.length === 0) continue;

      for (const row of data) {
        try {
          const r = row as any;
          
          // Get title - if no title, skip row
          const title = (r['Title'] || r['Tender Title'] || r['Work Description'] || r['Work Name'] || '').toString().trim();
          if (!title) continue;
          
          const organization = (r['Organization'] || r['Dept'] || r['Department'] || r['Ministry'] || '').toString().trim();
          const valueStr = (r['Value'] || r['Tender Value'] || r['EMD'] || r['Estimated Value'] || '0').toString();
          const value = Math.round(parseFloat(valueStr.replace(/[^0-9.-]/g, '') || '0') * 100);
          
          const deadlineStr = (r['Deadline'] || r['Due Date'] || r['End Date'] || '').toString();
          let deadline = new Date();
          if (deadlineStr) {
            const parsedDate = new Date(deadlineStr);
            if (!isNaN(parsedDate.getTime())) {
              deadline = parsedDate;
            }
          }
          
          const location = (r['Location'] || r['City'] || r['State'] || '').toString().trim();
          const referenceNo = (r['Reference No'] || r['Ref No'] || r['ID'] || '').toString().trim();
          const link = (r['Link'] || r['URL'] || '').toString().trim();
          
          // Check for duplicates by title
          const existing = await db.select().from(tenders).where(eq(tenders.title, title)).limit(1);
          if (existing.length > 0) {
            totalDuplicates++;
            continue;
          }
          
          // Insert tender (let PostgreSQL generate the UUID)
          await db.insert(tenders).values({
            title,
            organization: organization || 'Unknown',
            value,
            deadline,
            status: 'active',
            source: referenceNo.toLowerCase().includes('gem') ? 'gem' : 'non_gem',
            aiScore: 75,
            requirements: [],
            documents: [],
          });
          
          totalProcessed++;
        } catch (error) {
          console.log('Error processing row:', error);
        }
      }
    }

    // Insert directly with raw SQL to match actual database columns
    await db.execute(sql`
      INSERT INTO excel_uploads (file_name, file_path, uploaded_by, entries_added, entries_duplicate, total_entries, sheets_processed, status)
      VALUES (${fileName}, ${filePath}, ${uploadedBy}, ${totalProcessed}, ${totalDuplicates}, ${totalProcessed + totalDuplicates}, 1, 'completed')
    `);

    return {
      success: true,
      tendersProcessed: totalProcessed,
      duplicatesSkipped: totalDuplicates,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tendersProcessed: 0,
      duplicatesSkipped: 0,
    };
  }
}

// Simple tender results processing
export async function processTenderResultsExcel(filePath: string, fileName: string, uploadedBy: string) {
  try {
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    let totalProcessed = 0;
    let totalDuplicates = 0;

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (!data || data.length === 0) continue;

      // Skip header rows and process data
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i] as any[];
          
          // Skip empty rows
          if (!row || row.length === 0) continue;
          
          // Based on the structure: [id, number, referenceNo, title, date, location, organization, type, value1, value2, %, date2, stage, awardedTo, participants]
          const title = row[3] ? row[3].toString().trim() : '';
          
          // Skip empty rows
          if (!title) continue;
          
          console.log('Processing result:', title.substring(0, 50) + '...');
          
          const referenceNo = row[2] ? row[2].toString().trim() : '';
          const organization = row[6] ? row[6].toString().trim() : '';
          const awardedTo = row[13] ? row[13].toString().trim() : '';
          const location = row[5] ? row[5].toString().trim() : '';
          
          // Contract value from column 9 (index 8) or 10 (index 9)
          const contractValue = Math.round((parseFloat(row[8]) || parseFloat(row[9]) || 0) * 100);
          
          // Participator bidders from last column (index 14)
          const participatorsStr = row[14] ? row[14].toString().trim() : '';
          const participatorBidders = participatorsStr ? participatorsStr.split(',').map((s: any) => s.trim()).filter((s: any) => s) : [];
          
          // Result date from column 5 (index 4) 
          let resultDate = new Date();
          if (row[4]) {
            const parsedDate = new Date(row[4]);
            if (!isNaN(parsedDate.getTime())) {
              resultDate = parsedDate;
            }
          }
          
          // Determine status
          let status = 'missed_opportunity';
          const isAppentusWinner = awardedTo.toLowerCase().includes('appentus');
          const isAppentusParticipant = participatorBidders.some((bidder: any) => bidder.toLowerCase().includes('appentus'));
          
          if (isAppentusWinner) {
            status = 'won';
          } else if (isAppentusParticipant) {
            status = 'lost';
          }
          
          // Check for duplicates by title
          const existing = await db.select().from(enhancedTenderResults).where(eq(enhancedTenderResults.tenderTitle, title)).limit(1);
          if (existing.length > 0) {
            totalDuplicates++;
            continue;
          }
          
          // Insert directly with raw SQL to match actual database columns
          await db.execute(sql`
            INSERT INTO enhanced_tender_results (tender_title, organization, reference_no, location, tender_value, awarded_to, awarded_value, participator_bidders)
            VALUES (${title}, ${organization || 'Unknown'}, ${referenceNo || null}, ${location || null}, ${contractValue || null}, ${awardedTo || null}, ${contractValue || null}, ${JSON.stringify(participatorBidders)})
          `);
          
          totalProcessed++;
        } catch (error) {
          console.log('Error processing result row:', error);
        }
      }
    }

    // Insert directly with raw SQL to match actual database columns
    await db.execute(sql`
      INSERT INTO tender_results_imports (filename, original_name, results_processed, duplicates_skipped, status)
      VALUES (${fileName}, ${fileName}, ${totalProcessed}, ${totalDuplicates}, 'completed')
    `);

    return {
      success: true,
      resultsProcessed: totalProcessed,
      duplicatesSkipped: totalDuplicates,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      resultsProcessed: 0,
      duplicatesSkipped: 0,
    };
  }
}
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { db } from './db.js';
import { sql } from 'drizzle-orm';

export async function processSimpleExcelUpload(
  filePath: string, 
  fileName: string, 
  uploadedBy: string,
  progressCallback?: (progress: { processed: number, duplicates: number, total: number, percentage: number, gemAdded: number, nonGemAdded: number, errors: number }) => void
) {
  try {
    console.log(`Processing Excel file: ${fileName}`);
    
    // Use the working XLSX approach that works in the enhanced processor
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    console.log(`Found sheets: ${sheetNames.join(', ')}`);
    
    let totalProcessed = 0;
    let duplicates = 0;
    let totalErrors = 0;
    let sheetsProcessed = 0;
    let gemAdded = 0;
    let nonGemAdded = 0;
    
    for (const sheetName of sheetNames) {
      try {
        console.log(`Processing sheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (data.length <= 1) {
          console.log(`Sheet ${sheetName} has no data, skipping`);
          continue;
        }
        
        // Get headers from first row
        const headers = data[0].map(h => h ? h.toString().trim() : '');
        console.log(`Headers: ${headers.slice(0, 5).join(', ')}...`);
        
        // Find column indices
        const titleCol = headers.findIndex(h => h.toLowerCase().includes('brief') || h.toLowerCase().includes('title'));
        const orgCol = headers.findIndex(h => h.toLowerCase().includes('organization'));
        const valueCol = headers.findIndex(h => h.toLowerCase().includes('cost') || h.toLowerCase().includes('value'));
        const deadlineCol = headers.findIndex(h => h.toLowerCase().includes('deadline') || h.toLowerCase().includes('date'));
        const locationCol = headers.findIndex(h => h.toLowerCase().includes('location'));
        const refCol = headers.findIndex(h => h.toLowerCase().includes('reference'));
        const t247Col = headers.findIndex(h => h.toLowerCase().includes('t247'));
        
        // Determine source based on sheet name with better detection
        const sheetLower = sheetName.toLowerCase();
        let source = 'non_gem'; // Default to non_gem
        
        // More specific GeM detection
        if (sheetLower.includes('gem') && !sheetLower.includes('non')) {
          source = 'gem';
        }
        
        console.log(`Sheet "${sheetName}" classified as: ${source}`);
        
        // Track previous counts for this sheet
        const previousTotal = totalProcessed;
        const previousDuplicates = duplicates;
        
        // Process data rows
        for (let i = 1; i < data.length; i++) {
          try {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            const title = titleCol >= 0 ? (row[titleCol] || '').toString().trim() : '';
            if (!title || typeof title !== 'string' || title.toString().length < 5) continue;
            
            const organization = orgCol >= 0 ? (row[orgCol] || '').toString().trim() : 'Unknown';
            const valueStr = valueCol >= 0 ? (row[valueCol] || '0').toString().trim() : '0';
            const value = Math.round(parseFloat(valueStr.replace(/[^\d.]/g, ''))) || 0; // Keep as rupees, not paisa
            
            // Handle deadline
            let deadline = new Date();
            if (deadlineCol >= 0 && row[deadlineCol]) {
              const deadlineStr = row[deadlineCol].toString().trim();
              if (deadlineStr) {
                const parsed = new Date(deadlineStr);
                if (!isNaN(parsed.getTime())) {
                  deadline = parsed;
                }
              }
            }
            
            const location = locationCol >= 0 ? (row[locationCol] || '').toString().trim() : '';
            const reference = refCol >= 0 ? (row[refCol] || '').toString().trim() : '';
            const t247Id = t247Col >= 0 ? (row[t247Col] || '').toString().trim() : '';
            
            // Extract hyperlink from the title column (TENDER BRIEF typically has links)
            let link = null;
            if (titleCol >= 0) {
              const cell = worksheet[XLSX.utils.encode_cell({ r: i, c: titleCol })];
              if (cell && cell.l && cell.l.Target) {
                link = cell.l.Target;
              }
            }
            
            // More precise duplicate checking - only check valid identifiers
            let isDuplicate = false;
            
            // Primary check: T247 ID (only for numeric IDs with sufficient length)
            if (t247Id && t247Id.length >= 6 && /^\d+$/.test(t247Id)) {
              try {
                const existingByT247 = await db.execute(sql`
                  SELECT id FROM tenders 
                  WHERE requirements::text LIKE '%"t247_id":"' || ${t247Id} || '"%'
                  LIMIT 1
                `);
                
                if (existingByT247.length > 0) {
                  console.log(`Duplicate T247 ID found: ${t247Id}, skipping...`);
                  isDuplicate = true;
                }
              } catch (error) {
                console.log(`Error checking T247 duplicate:`, error);
              }
            }
            
            // Secondary check: Reference No (only for substantial references with proper format)
            if (!isDuplicate && reference && reference.length > 8 && (reference.includes('/') || reference.includes('GEM'))) {
              try {
                const existingByRef = await db.execute(sql`
                  SELECT id FROM tenders 
                  WHERE requirements::text LIKE '%"reference":"' || ${reference} || '"%'
                  LIMIT 1
                `);
                
                if (existingByRef.length > 0) {
                  console.log(`Duplicate Reference No found: ${reference}, skipping...`);
                  isDuplicate = true;
                }
              } catch (error) {
                console.log(`Error checking Reference No duplicate:`, error);
              }
            }
            
            if (isDuplicate) {
              duplicates++;
              continue;
            }
            
            // Simple AI score based on keywords
            const techKeywords = ['software', 'it', 'technology', 'digital', 'system', 'web', 'mobile'];
            const matchCount = techKeywords.filter(keyword => title.toLowerCase().includes(keyword)).length;
            const aiScore = Math.min(85, 30 + (matchCount * 15));
            
            // Insert into database
            await db.execute(sql`
              INSERT INTO tenders (
                title, organization, value, deadline, status, source, ai_score,
                description, requirements, link
              )
              VALUES (
                ${title}, ${organization}, ${value}, ${deadline.toISOString()}, 'active', ${source}, ${aiScore},
                ${'Imported from ' + sheetName}, 
                ${JSON.stringify([{
                  location: location,
                  reference: reference,
                  t247_id: t247Id,
                  sheet: sheetName
                }])}, 
                ${link}
              )
            `);
            
            totalProcessed++;
            
            // Track by sheet type
            if (source === 'gem') {
              gemAdded++;
            } else {
              nonGemAdded++;
            }
            
            // More frequent progress updates
            if (totalProcessed % 10 === 0) {
              console.log(`Progress: ${totalProcessed} entries processed, ${duplicates} duplicates skipped...`);
              
              // Call progress callback if provided
              if (progressCallback) {
                // Calculate based on estimated total rows (approximate)
                const estimatedTotal = 2500; // Rough estimate for total rows across sheets
                const percentage = Math.min(95, Math.floor((totalProcessed / estimatedTotal) * 100));
                const progressData = {
                  processed: totalProcessed,
                  duplicates: duplicates,
                  total: totalProcessed + duplicates,
                  percentage: percentage,
                  gemAdded: gemAdded,
                  nonGemAdded: nonGemAdded,
                  errors: totalErrors
                };
                console.log('Calling progress callback with:', progressData);
                progressCallback(progressData);
              }
            }
            
          } catch (rowError) {
            console.error(`Error processing row ${i}:`, rowError);
            totalErrors++;
          }
        }
        
        sheetsProcessed++;
        console.log(`Completed sheet ${sheetName}: ${totalProcessed} entries added, ${duplicates} duplicates skipped`);
        
        // Log hyperlink extraction for this sheet  
        try {
          const sheetLinksCount = await db.execute(sql`
            SELECT COUNT(*) as count FROM tenders 
            WHERE link IS NOT NULL AND link != '' 
            AND requirements::text LIKE '%"sheet":"${sheetName}"%'
          `);
          console.log(`Hyperlinks extracted from ${sheetName}: ${sheetLinksCount[0]?.count || 0} links`);
        } catch (linkError) {
          console.log('Error checking hyperlinks:', linkError);
        }
        
      } catch (sheetError) {
        console.error(`Error processing sheet ${sheetName}:`, sheetError);
        totalErrors++;
      }
    }
    
    // Record the import
    try {
      await db.execute(sql`
        INSERT INTO excel_uploads (id, file_name, file_path, uploaded_by, entries_added, entries_duplicate, total_entries, sheets_processed, status, uploaded_at)
        VALUES (gen_random_uuid(), ${fileName}, ${filePath}, ${uploadedBy}, ${totalProcessed}, ${duplicates}, ${totalProcessed + duplicates}, ${sheetsProcessed}, 'completed', NOW())
      `);
    } catch (insertError) {
      console.error('Failed to record import:', insertError);
    }
    
    console.log(`Processing complete: ${totalProcessed} entries added, ${duplicates} duplicates skipped, ${totalErrors} errors, ${sheetsProcessed} sheets`);
    
    // Final hyperlink extraction stats
    try {
      const totalLinksCount = await db.execute(sql`SELECT COUNT(*) as count FROM tenders WHERE link IS NOT NULL AND link != ''`);
      console.log(`Total hyperlinks extracted: ${totalLinksCount[0]?.count || 0} links found`);
    } catch (linkError) {
      console.log('Error checking total hyperlinks:', linkError);
    }
    
    // Final progress callback
    if (progressCallback) {
      progressCallback({
        processed: totalProcessed,
        duplicates: duplicates,
        total: totalProcessed + duplicates,
        percentage: 100,
        gemAdded: gemAdded,
        nonGemAdded: nonGemAdded,
        errors: totalErrors
      });
    }

    return {
      success: true,
      tendersProcessed: totalProcessed,
      duplicatesSkipped: duplicates,
      errorsEncountered: totalErrors,
      sheetsProcessed: sheetsProcessed,
      gemAdded: gemAdded,
      nonGemAdded: nonGemAdded
    };
    
  } catch (error) {
    console.error('Excel processing error:', error);
    return {
      success: false,
      error: (error as Error).message,
      tendersProcessed: 0,
      duplicatesSkipped: 0
    };
  }
}
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { db } from './db.js';
import { sql } from 'drizzle-orm';

export async function processSimpleExcelUpload(filePath: string, fileName: string, uploadedBy: string) {
  try {
    console.log(`Processing Excel file: ${fileName}`);
    
    // Use the working XLSX approach that works in the enhanced processor
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    console.log(`Found sheets: ${sheetNames.join(', ')}`);
    
    let totalProcessed = 0;
    let totalErrors = 0;
    let sheetsProcessed = 0;
    
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
        
        // Determine source based on sheet name
        const source = sheetName.toLowerCase().includes('gem') ? 'gem' : 'non_gem';
        
        // Process data rows
        for (let i = 1; i < data.length; i++) {
          try {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            const title = titleCol >= 0 ? (row[titleCol] || '').toString().trim() : '';
            if (!title || typeof title !== 'string' || title.length < 5) continue;
            
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
            
            // Check for duplicates using T247 ID
            if (t247Id) {
              const existingTender = await db.execute(sql`
                SELECT id FROM tenders 
                WHERE requirements::text LIKE ${'%"t247_id":"' + t247Id + '"%'}
              `);
              
              if (existingTender.rows.length > 0) {
                console.log(`Duplicate T247 ID found: ${t247Id}, skipping...`);
                continue;
              }
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
                null
              )
            `);
            
            totalProcessed++;
            
            if (totalProcessed % 50 === 0) {
              console.log(`Processed ${totalProcessed} tenders...`);
            }
            
          } catch (rowError) {
            console.error(`Error processing row ${i}:`, rowError);
            totalErrors++;
          }
        }
        
        sheetsProcessed++;
        console.log(`Completed sheet ${sheetName}: ${totalProcessed} total processed`);
        
      } catch (sheetError) {
        console.error(`Error processing sheet ${sheetName}:`, sheetError);
        totalErrors++;
      }
    }
    
    // Record the import
    try {
      await db.execute(sql`
        INSERT INTO excel_uploads (id, file_name, file_path, uploaded_by, entries_added, entries_duplicate, total_entries, sheets_processed, status, uploaded_at)
        VALUES (gen_random_uuid(), ${fileName}, ${filePath}, ${uploadedBy}, ${totalProcessed}, 0, ${totalProcessed}, ${sheetsProcessed}, 'completed', NOW())
      `);
    } catch (insertError) {
      console.error('Failed to record import:', insertError);
    }
    
    console.log(`Processing complete: ${totalProcessed} processed, ${totalErrors} errors, ${sheetsProcessed} sheets`);
    
    return {
      success: true,
      tendersProcessed: totalProcessed,
      duplicatesSkipped: 0,
      errorsEncountered: totalErrors,
      sheetsProcessed: sheetsProcessed
    };
    
  } catch (error) {
    console.error('Excel processing error:', error);
    return {
      success: false,
      error: error.message,
      tendersProcessed: 0,
      duplicatesSkipped: 0
    };
  }
}
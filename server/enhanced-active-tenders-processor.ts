import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { db } from './db.js';
import { sql } from 'drizzle-orm';

// Enhanced processor for active tenders with multi-sheet support
export async function processActiveTendersWithSubsheets(filePath: string, fileName: string, uploadedBy: string) {
  try {
    console.log(`Processing active tenders with subsheets from: ${fileName}`);
    
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    let totalProcessed = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    let sheetsProcessed = 0;
    
    console.log(`Found ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\nProcessing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row handling
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (!rawData || rawData.length < 2) {
        console.log(`Sheet ${sheetName} has insufficient data, skipping...`);
        continue;
      }
      
      // Find the actual header row (might not be row 0)
      let headerRowIndex = -1;
      let headers: string[] = [];
      
      for (let i = 0; i < Math.min(3, rawData.length); i++) {
        const row = rawData[i] as any[];
        if (row && row.length > 0) {
          const possibleHeaders = ['title', 'organization', 'value', 'deadline', 'tender', 'work', 'brief'];
          const matchCount = row.filter(cell => 
            cell && possibleHeaders.some(h => 
              cell.toString().toLowerCase().includes(h)
            )
          ).length;
          
          if (matchCount >= 2) {
            headerRowIndex = i;
            headers = row.map(cell => cell ? cell.toString() : '');
            break;
          }
        }
      }
      
      if (headerRowIndex === -1) {
        console.log(`No valid headers found in sheet ${sheetName}, skipping...`);
        continue;
      }
      
      console.log(`Using headers from row ${headerRowIndex}:`, headers);
      
      // Create column mapping
      const getColumnIndex = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          const index = headers.findIndex(h => 
            h && h.toLowerCase().includes(name.toLowerCase())
          );
          if (index !== -1) return index;
        }
        return -1;
      };
      
      const columnMap = {
        title: getColumnIndex(['tender brief', 'brief', 'title', 'tender title', 'work description', 'work name', 'description']),
        organization: getColumnIndex(['organization', 'dept', 'department', 'ministry', 'agency']),
        value: getColumnIndex(['estimated cost', 'value', 'tender value', 'estimated value', 'amount', 'emd', 'cost']),
        deadline: getColumnIndex(['deadline', 'due date', 'end date', 'closing date', 'last date']),
        location: getColumnIndex(['location', 'place', 'city', 'state', 'region']),
        referenceNo: getColumnIndex(['reference no', 'reference', 'ref no', 'tender no', 't247 id', 'id', 'number']),
        department: getColumnIndex(['department name', 'department', 'dept', 'division', 'section']),
        category: getColumnIndex(['similar category', 'category', 'type', 'classification', 'sector']),
        source: getColumnIndex(['source', 'portal', 'website', 'platform']),
        turnover: getColumnIndex(['turnover', 'minimum annual turnover', 'annual turnover', 'required turnover', 'bidder turnover', 'minimum average annual turnover'])
      };
      
      console.log('Column mapping for sheet:', sheetName, columnMap);
      
      // Process data rows (skip header row and empty rows)
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i] as any[];
        
        if (!row || row.length === 0 || row.every(cell => !cell)) {
          continue; // Skip empty rows
        }
        
        try {
          // Extract tender title (required)
          const title = columnMap.title >= 0 ? 
            (row[columnMap.title] || '').toString().trim() : '';
          
          if (!title || title.length < 10) {
            continue; // Skip rows without meaningful titles
          }
          
          // Extract T247 ID for duplicate checking (T247 ID is in column 1)
          const t247IdColumn = headers.findIndex(h => 
            h && h.toLowerCase().includes('t247 id')
          );
          const t247Id = t247IdColumn >= 0 ? 
            (row[t247IdColumn] || '').toString().trim() : null;
          
          // Check for duplicates based on T247 ID or title
          let isDuplicate = false;
          if (t247Id) {
            const existingById = await db.execute(sql`
              SELECT id FROM tenders 
              WHERE requirements::text LIKE ${'%"t247_id":"' + t247Id + '"%'}
              LIMIT 1
            `);
            if (existingById.length > 0) {
              isDuplicate = true;
            }
          }
          
          if (!isDuplicate) {
            const existingByTitle = await db.execute(sql`
              SELECT id FROM tenders 
              WHERE title = ${title}
              LIMIT 1
            `);
            if (existingByTitle.length > 0) {
              isDuplicate = true;
            }
          }
          
          if (isDuplicate) {
            totalDuplicates++;
            continue;
          }
          
          // Extract other fields
          const organization = columnMap.organization >= 0 ? 
            (row[columnMap.organization] || 'Unknown').toString().trim() : 'Unknown';
          
          const location = columnMap.location >= 0 ? 
            (row[columnMap.location] || '').toString().trim() || null : null;
          
          // Use the correct column for reference number (REFERENCE NO column, not SR. NO.)
          const referenceNoColumn = headers.findIndex(h => 
            h && h.toLowerCase().includes('reference no')
          );
          const referenceNo = referenceNoColumn >= 0 ? 
            (row[referenceNoColumn] || '').toString().trim() || null : null;
          
          // Determine source first
          let source = 'non_gem';
          if (organization.toLowerCase().includes('gem') || title.toLowerCase().includes('gem')) {
            source = 'gem';
          }
          
          // Extract hyperlinks from TENDER BRIEF column
          let tenderLink = null;
          
          // For Excel hyperlinks, check if the cell has hyperlink data
          try {
            const cellAddress = worksheet.getCell(i + 1, columnMap.title + 1);
            if (cellAddress && cellAddress.hyperlink) {
              if (typeof cellAddress.hyperlink === 'string') {
                tenderLink = cellAddress.hyperlink;
              } else if (cellAddress.hyperlink.hyperlink) {
                tenderLink = cellAddress.hyperlink.hyperlink;
              }
            }
          } catch (error) {
            // Continue with text-based URL extraction
            console.log(`Hyperlink extraction error for row ${i + 1}:`, error);
          }
          
          // If no hyperlink, look for URL patterns in the title text
          if (!tenderLink) {
            const urlRegex = /(https?:\/\/[^\s\)]+)/gi;
            const urlMatch = title.match(urlRegex);
            if (urlMatch && urlMatch.length > 0) {
              tenderLink = urlMatch[0];
            }
          }
          
          // If no direct URL, try to construct tender portal links
          if (!tenderLink && referenceNo) {
            if (referenceNo.toLowerCase().includes('gem') || source === 'gem') {
              tenderLink = `https://gem.gov.in/tender/search?q=${encodeURIComponent(referenceNo)}`;
            } else if (referenceNo.toLowerCase().includes('eprocure')) {
              tenderLink = `https://eprocure.gov.in/eprocure/app?searchTender=${encodeURIComponent(referenceNo)}`;
            } else {
              // For Non-GeM tenders, try to construct general search links
              tenderLink = `https://tender247.com/tender-search?ref=${encodeURIComponent(referenceNo)}`;
            }
          }
          
          const department = columnMap.department >= 0 ? 
            (row[columnMap.department] || '').toString().trim() || null : null;
          
          const category = columnMap.category >= 0 ? 
            (row[columnMap.category] || '').toString().trim() || null : null;
          
          // Extract turnover requirement
          const turnover = columnMap.turnover >= 0 ? 
            (row[columnMap.turnover] || '').toString().trim() || null : null;
          
          // Extract additional GeM fields
          const msmeExemption = headers.findIndex(h => h && h.toLowerCase().includes('msme exemption')) >= 0 ?
            (row[headers.findIndex(h => h && h.toLowerCase().includes('msme exemption'))] || '').toString().trim() || null : null;
            
          const startupExemption = headers.findIndex(h => h && h.toLowerCase().includes('startup exemption')) >= 0 ?
            (row[headers.findIndex(h => h && h.toLowerCase().includes('startup exemption'))] || '').toString().trim() || null : null;
            
          const eligibilityCriteria = headers.findIndex(h => h && h.toLowerCase().includes('eligibility criteria')) >= 0 ?
            (row[headers.findIndex(h => h && h.toLowerCase().includes('eligibility criteria'))] || '').toString().trim() || null : null;
            
          const checklist = headers.findIndex(h => h && h.toLowerCase().includes('checklist')) >= 0 ?
            (row[headers.findIndex(h => h && h.toLowerCase().includes('checklist'))] || '').toString().trim() || null : null;
          
          // Parse tender value
          const valueStr = columnMap.value >= 0 ? 
            (row[columnMap.value] || '0').toString() : '0';
          const value = Math.round(parseFloat(valueStr.replace(/[^0-9.-]/g, '') || '0') * 100);
          
          // Parse deadline with better date handling
          let deadline = new Date();
          deadline.setDate(deadline.getDate() + 30); // Default 30 days from now
          
          if (columnMap.deadline >= 0) {
            const deadlineStr = (row[columnMap.deadline] || '').toString().trim();
            if (deadlineStr) {
              // Handle Excel date serial numbers
              if (!isNaN(Number(deadlineStr)) && Number(deadlineStr) > 40000) {
                // Excel date serial number (days since 1900-01-01)
                const excelDate = new Date((Number(deadlineStr) - 25569) * 86400 * 1000);
                if (!isNaN(excelDate.getTime())) {
                  deadline = excelDate;
                }
              } else {
                // Try parsing as regular date string
                const parsedDate = new Date(deadlineStr);
                if (!isNaN(parsedDate.getTime())) {
                  deadline = parsedDate;
                }
              }
            }
          }
          

          
          // Calculate basic AI score (can be enhanced later)
          let aiScore = 50; // Default score
          
          // Simple keyword-based scoring
          const techKeywords = ['software', 'it', 'technology', 'digital', 'system', 'web', 'mobile', 'application'];
          const titleLower = title.toLowerCase();
          const matchingKeywords = techKeywords.filter(keyword => titleLower.includes(keyword));
          
          if (matchingKeywords.length > 0) {
            aiScore = Math.min(85, 50 + (matchingKeywords.length * 10));
          }
          
          // Check for duplicates using T247 ID
          const existingTender = await db.execute(sql`
            SELECT id FROM tenders 
            WHERE requirements::text LIKE ${'%"t247_id":"' + t247Id + '"%'}
          `);
          
          if (existingTender.rows.length > 0) {
            totalDuplicates++;
            continue;
          }
          
          // Insert into database
          await db.execute(sql`
            INSERT INTO tenders (
              title, organization, value, deadline, status, source, ai_score,
              description, assigned_to, requirements, link
            )
            VALUES (
              ${title}, ${organization}, ${value}, ${deadline.toISOString()}, 'active', ${source}, ${aiScore},
              ${'Imported from ' + sheetName + ' - ' + fileName}, null,
              ${JSON.stringify([{
                location: location,
                reference: referenceNo,
                department: department,
                category: category,
                sheet: sheetName,
                t247_id: t247Id,
                turnover: turnover,
                msmeExemption: msmeExemption,
                startupExemption: startupExemption,
                eligibilityCriteria: eligibilityCriteria,
                checklist: checklist,
                documentFees: documentFees,
                emd: emd,
                quantity: quantity
              }])}, ${tenderLink}
            )
          `);
          
          totalProcessed++;
          
          if (totalProcessed % 100 === 0) {
            console.log(`Processed ${totalProcessed} tenders from ${sheetsProcessed + 1} sheets...`);
          }
          
        } catch (error) {
          console.error(`Error processing row ${i} in sheet ${sheetName}:`, (error as Error).message);
          totalErrors++;
        }
      }
      
      sheetsProcessed++;
      console.log(`Completed sheet ${sheetName}: ${totalProcessed} total processed so far`);
    }
    
    // Record the import
    await db.execute(sql`
      INSERT INTO excel_uploads (file_name, file_path, uploaded_by, entries_added, entries_duplicate, total_entries, sheets_processed, status, uploaded_at)
      VALUES (${fileName}, ${filePath}, ${uploadedBy}, ${totalProcessed}, ${totalDuplicates}, ${totalProcessed + totalDuplicates}, ${sheetsProcessed}, 'completed', NOW())
    `);
    
    console.log(`\nProcessing complete:`);
    console.log(`- Total processed: ${totalProcessed}`);
    console.log(`- Duplicates skipped: ${totalDuplicates}`);
    console.log(`- Errors: ${totalErrors}`);
    console.log(`- Sheets processed: ${sheetsProcessed}`);
    
    return {
      success: true,
      tendersProcessed: totalProcessed,
      duplicatesSkipped: totalDuplicates,
      errorsEncountered: totalErrors,
      sheetsProcessed: sheetsProcessed
    };
    
  } catch (error) {
    console.error('Error processing active tenders Excel:', error);
    return {
      success: false,
      error: error.message,
      tendersProcessed: 0,
      duplicatesSkipped: 0
    };
  }
}

// Test with the provided file
export async function testActiveTendersProcessing() {
  const filePath = '../attached_assets/Tenders-(07-28-2025)_1753884258674.xlsx';
  const result = await processActiveTendersWithSubsheets(filePath, 'test-active-tenders.xlsx', 'admin');
  console.log('Test result:', result);
  return result;
}
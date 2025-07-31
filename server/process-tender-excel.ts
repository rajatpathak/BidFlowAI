import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { db } from './db.js';
import { sql } from 'drizzle-orm';

// Process tender results Excel with proper column mapping
export async function processTenderResultsExcel(filePath: string, fileName: string, uploadedBy: string) {
  try {
    console.log(`Processing tender results from: ${fileName}`);
    
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    let totalProcessed = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    
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
      
      // Get headers from first row
      const headers = rawData[0] as string[];
      console.log('Headers found:', headers);
      
      // Create column mapping
      const getColumnIndex = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          const index = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes(name.toLowerCase())
          );
          if (index !== -1) return index;
        }
        return -1;
      };
      
      const columnMap = {
        srNo: getColumnIndex(['SR. NO', 'SR NO', 'Serial']),
        tenderId: getColumnIndex(['TR247 ID', 'ID', 'Tender ID']),
        referenceNo: getColumnIndex(['TENDER REFERENCE NO', 'Reference', 'Ref No']),
        tenderTitle: getColumnIndex(['TENDER RESULT BRIEF', 'Title', 'Description', 'Brief']),
        endDate: getColumnIndex(['End Submission date', 'Deadline', 'End Date']),
        location: getColumnIndex(['LOCATION', 'Place', 'City']),
        department: getColumnIndex(['Department', 'Dept', 'Ministry']),
        ownership: getColumnIndex(['Ownership', 'Type']),
        estimatedValue: getColumnIndex(['Estimated Value', 'Value', 'Amount']),
        contractValue: getColumnIndex(['Contract Value', 'Awarded Value', 'Final Value']),
        marginalDiff: getColumnIndex(['Marginal Difference', 'Difference']),
        lastUpdated: getColumnIndex(['Last Updated on', 'Updated', 'Date']),
        tenderStage: getColumnIndex(['Tender Stage', 'Stage', 'Status']),
        winnerBidder: getColumnIndex(['Winner bidder', 'Winner', 'Awarded To']),
        participatorBidders: getColumnIndex(['Participator Bidders', 'Bidders', 'Participants'])
      };
      
      console.log('Column mapping:', columnMap);
      
      // Process data rows (skip header row)
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i] as any[];
        
        try {
          // Extract tender title (required)
          const tenderTitle = columnMap.tenderTitle >= 0 ? 
            (row[columnMap.tenderTitle] || '').toString().trim() : '';
          
          if (!tenderTitle) {
            console.log(`Row ${i}: Skipping - no tender title`);
            continue;
          }
          
          // Check for duplicates based on title
          const existingResult = await db.execute(sql`
            SELECT id FROM enhanced_tender_results 
            WHERE tender_title = ${tenderTitle}
            LIMIT 1
          `);
          
          if (existingResult.rows && existingResult.rows.length > 0) {
            totalDuplicates++;
            continue;
          }
          
          // Extract other fields
          const referenceNo = columnMap.referenceNo >= 0 ? 
            (row[columnMap.referenceNo] || '').toString().trim() || null : null;
          
          const location = columnMap.location >= 0 ? 
            (row[columnMap.location] || '').toString().trim() || null : null;
          
          const department = columnMap.department >= 0 ? 
            (row[columnMap.department] || '').toString().trim() || null : null;
          
          // Parse values
          const estimatedValueStr = columnMap.estimatedValue >= 0 ? 
            (row[columnMap.estimatedValue] || '0').toString() : '0';
          const estimatedValue = Math.round(parseFloat(estimatedValueStr.replace(/[^0-9.-]/g, '') || '0') * 100);
          
          const contractValueStr = columnMap.contractValue >= 0 ? 
            (row[columnMap.contractValue] || estimatedValueStr).toString() : estimatedValueStr;
          const contractValue = Math.round(parseFloat(contractValueStr.replace(/[^0-9.-]/g, '') || '0') * 100);
          
          // Winner information
          const winnerBidder = columnMap.winnerBidder >= 0 ? 
            (row[columnMap.winnerBidder] || '').toString().trim() || null : null;
          
          // Parse participator bidders
          let participatorBidders = [];
          if (columnMap.participatorBidders >= 0) {
            const biddersStr = (row[columnMap.participatorBidders] || '').toString().trim();
            if (biddersStr) {
              participatorBidders = biddersStr
                .split(/[,;|\n]/)
                .map(bidder => bidder.trim())
                .filter(bidder => bidder.length > 0);
            }
          }
          
          // Tender stage
          const tenderStage = columnMap.tenderStage >= 0 ? 
            (row[columnMap.tenderStage] || 'completed').toString().trim().toLowerCase() : 'completed';
          
          // Parse marginal difference
          const marginalDiff = columnMap.marginalDiff >= 0 ? 
            (row[columnMap.marginalDiff] || '0').toString() : '0';
          const marginalDifference = Math.round(parseFloat(marginalDiff.replace(/[^0-9.-]/g, '') || '0') * 100);
          
          // Check Appentus involvement
          const isAppentusWinner = winnerBidder && winnerBidder.toLowerCase().includes('appentus');
          const isAppentusParticipant = participatorBidders.some(bidder => 
            bidder.toLowerCase().includes('appentus')
          );
          
          // Calculate AI match score
          let aiMatchScore = 30;
          if (isAppentusWinner) {
            aiMatchScore = 100;
          } else if (isAppentusParticipant) {
            aiMatchScore = 85;
          }
          
          // Insert into database
          await db.execute(sql`
            INSERT INTO enhanced_tender_results (
              tender_title, organization, reference_no, location, department,
              tender_value, contract_value, marginal_difference, tender_stage,
              awarded_to, awarded_value, participator_bidders, 
              company_eligible, ai_match_score, notes
            )
            VALUES (
              ${tenderTitle}, ${department || 'Unknown'}, ${referenceNo}, ${location}, ${department},
              ${estimatedValue}, ${contractValue}, ${marginalDifference}, ${tenderStage},
              ${winnerBidder}, ${contractValue}, ${JSON.stringify(participatorBidders)},
              ${isAppentusWinner || isAppentusParticipant}, ${aiMatchScore}, 
              ${'Imported from ' + fileName + ' - Sheet: ' + sheetName}
            )
          `);
          
          totalProcessed++;
          
          if (totalProcessed % 500 === 0) {
            console.log(`Processed ${totalProcessed} records...`);
          }
          
        } catch (error) {
          console.error(`Error processing row ${i}:`, error);
          totalErrors++;
        }
      }
    }
    
    // Record the import
    await db.execute(sql`
      INSERT INTO tender_results_imports (filename, original_name, results_processed, duplicates_skipped, status)
      VALUES (${fileName}, ${fileName}, ${totalProcessed}, ${totalDuplicates}, 'completed')
    `);
    
    console.log(`\nProcessing complete:`);
    console.log(`- Total processed: ${totalProcessed}`);
    console.log(`- Duplicates skipped: ${totalDuplicates}`);
    console.log(`- Errors: ${totalErrors}`);
    
    return {
      success: true,
      resultsProcessed: totalProcessed,
      duplicatesSkipped: totalDuplicates,
      errorsEncountered: totalErrors,
      sheetsProcessed: workbook.SheetNames.length
    };
    
  } catch (error) {
    console.error('Error processing tender results Excel:', error);
    return {
      success: false,
      error: error.message,
      resultsProcessed: 0,
      duplicatesSkipped: 0
    };
  }
}

// Test with the provided file
export async function testTenderResultsProcessing() {
  const filePath = '../attached_assets/Results-(07-29-2025)_1753884230517.xlsx';
  const result = await processTenderResultsExcel(filePath, 'test-results.xlsx', 'admin');
  console.log('Test result:', result);
  return result;
}
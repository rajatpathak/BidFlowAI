import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { db } from './db.js';
import { enhancedTenderResults } from '../shared/schema.js';
import { sql } from 'drizzle-orm';

// Enhanced processor for tender results with multi-sheet support
export async function processEnhancedTenderResults(filePath: string, fileName: string, uploadedBy: string) {
  try {
    console.log(`Processing enhanced tender results from: ${fileName}`);
    
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    let totalProcessed = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    
    console.log(`Found ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\nProcessing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (!data || data.length === 0) {
        console.log(`Sheet ${sheetName} is empty, skipping...`);
        continue;
      }
      
      console.log(`Sheet ${sheetName} has ${data.length} rows`);
      
      // Process each row in the sheet
      for (const row of data) {
        try {
          const r = row as any;
          
          // Extract tender title (required field)
          const tenderTitle = (
            r['Tender Title'] || 
            r['Title'] || 
            r['Work Description'] || 
            r['Work Name'] || 
            r['Description'] || 
            ''
          ).toString().trim();
          
          if (!tenderTitle) {
            console.log('Skipping row - no tender title');
            continue;
          }
          
          // Check for duplicates
          const existingResult = await db.execute(sql`
            SELECT id FROM enhanced_tender_results 
            WHERE tender_title = ${tenderTitle}
            LIMIT 1
          `);
          
          if (existingResult.rows && existingResult.rows.length > 0) {
            totalDuplicates++;
            continue;
          }
          
          // Extract other fields with multiple possible column names
          const organization = (
            r['Organization'] || 
            r['Department'] || 
            r['Ministry'] || 
            r['Dept'] || 
            r['Agency'] || 
            'Unknown'
          ).toString().trim();
          
          const referenceNo = (
            r['Reference No'] || 
            r['Tender No'] || 
            r['Ref No'] || 
            r['Reference'] || 
            r['ID'] || 
            null
          )?.toString().trim() || null;
          
          const location = (
            r['Location'] || 
            r['State'] || 
            r['City'] || 
            r['Place'] || 
            null
          )?.toString().trim() || null;
          
          const department = (
            r['Department'] || 
            r['Dept'] || 
            null
          )?.toString().trim() || null;
          
          // Parse tender value
          const tenderValueStr = (
            r['Tender Value'] || 
            r['Value'] || 
            r['Amount'] || 
            r['Estimated Value'] || 
            '0'
          ).toString();
          const tenderValue = Math.round(parseFloat(tenderValueStr.replace(/[^0-9.-]/g, '') || '0') * 100);
          
          // Parse contract value
          const contractValueStr = (
            r['Contract Value'] || 
            r['Awarded Value'] || 
            r['Final Value'] || 
            tenderValueStr
          ).toString();
          const contractValue = Math.round(parseFloat(contractValueStr.replace(/[^0-9.-]/g, '') || '0') * 100);
          
          // Extract winner information
          const awardedTo = (
            r['Awarded To'] || 
            r['Winner'] || 
            r['Winner Bidder'] || 
            r['Selected Bidder'] || 
            null
          )?.toString().trim() || null;
          
          const awardedValue = contractValue || null;
          
          // Parse participator bidders
          let participatorBidders = [];
          const participatorStr = (
            r['Participator Bidders'] || 
            r['Bidders'] || 
            r['All Bidders'] || 
            r['Participants'] || 
            ''
          ).toString().trim();
          
          if (participatorStr) {
            participatorBidders = participatorStr
              .split(/[,;|\n]/)
              .map(bidder => bidder.trim())
              .filter(bidder => bidder.length > 0);
          }
          
          // Parse dates
          let resultDate = null;
          const resultDateStr = (
            r['Result Date'] || 
            r['Award Date'] || 
            r['Decision Date'] || 
            ''
          ).toString().trim();
          
          if (resultDateStr) {
            const parsedDate = new Date(resultDateStr);
            if (!isNaN(parsedDate.getTime())) {
              resultDate = parsedDate;
            }
          }
          
          // Get tender stage/status
          const tenderStage = (
            r['Tender Stage'] || 
            r['Status'] || 
            r['Stage'] || 
            'completed'
          ).toString().trim().toLowerCase();
          
          // Check if Appentus won or participated
          const isAppentusWinner = awardedTo && awardedTo.toLowerCase().includes('appentus');
          const isAppentusParticipant = participatorBidders.some(bidder => 
            bidder.toLowerCase().includes('appentus')
          );
          
          // Calculate AI match score based on Appentus involvement
          let aiMatchScore = 30; // Default score
          if (isAppentusWinner) {
            aiMatchScore = 100;
          } else if (isAppentusParticipant) {
            aiMatchScore = 85;
          }
          
          // Insert into database
          await db.execute(sql`
            INSERT INTO enhanced_tender_results (
              tender_title, organization, reference_no, location, department,
              tender_value, contract_value, status, awarded_to, awarded_value,
              participator_bidders, result_date, tender_stage, ai_match_score,
              company_eligible, notes
            )
            VALUES (
              ${tenderTitle}, ${organization}, ${referenceNo}, ${location}, ${department},
              ${tenderValue}, ${contractValue}, ${tenderStage}, ${awardedTo}, ${awardedValue},
              ${JSON.stringify(participatorBidders)}, ${resultDate}, ${tenderStage}, ${aiMatchScore},
              ${isAppentusWinner || isAppentusParticipant}, ${'Imported from ' + sheetName}
            )
          `);
          
          totalProcessed++;
          
          if (totalProcessed % 100 === 0) {
            console.log(`Processed ${totalProcessed} records...`);
          }
          
        } catch (error) {
          console.error('Error processing row:', error);
          totalErrors++;
        }
      }
    }
    
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
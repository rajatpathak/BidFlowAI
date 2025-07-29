import * as XLSX from 'xlsx';
import fs from 'fs';
import { db } from './db';
import { enhancedTenderResults } from '@shared/schema';
import { companySettings, tenderAssignments } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function importExcelFile() {
  const filePath = '../attached_assets/Results-(07-29-2025)_1753792177743.xlsx';
  console.log(`Starting import from: ${filePath}`);
  
  try {
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    
    // Get company settings and assignments
    const [settings] = await db.select().from(companySettings);
    const assignments = await db.select().from(tenderAssignments);
    
    let totalProcessed = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Processing sheet: ${sheetName} with ${data.length} rows`);
      
      for (const row of data) {
        try {
          totalProcessed++;
          
          // Map the row data
          const r: any = row;
          
          // Helper function to get field value by multiple possible names
          const getField = (names: string[]) => {
            for (const name of names) {
              if (r[name] !== undefined && r[name] !== null && r[name] !== '') {
                return r[name];
              }
            }
            return '';
          };
          
          const tenderTitle = getField(['Title', 'Tender Title', 'Work Description', 'TENDER RESULT BRIEF']);
          const referenceNo = getField(['TENDER REFERENCE NO', 'Reference No', 'Ref No', 'ID']) || 
                             r['__EMPTY_1'] || ''; // Sometimes ref no is in unlabeled column
          
          // Skip if no title
          if (!tenderTitle || tenderTitle === 'SR. NO.') {
            continue;
          }
          
          const organization = getField(['Organization', 'Dept', 'Department', 'Ownership']);
          const location = getField(['Location', 'City', 'State', 'LOCATION']);
          const department = getField(['Department', 'Division']);
          const awardedTo = getField(['Awarded To', 'Winner', 'Winner bidder']);
          const contractValueStr = getField(['Contract Value', 'Awarded Value']);
          const contractValue = contractValueStr ? Math.round(parseFloat(contractValueStr.toString().replace(/[^0-9.-]/g, '') || "0") * 100) : null;
          const estimatedValueStr = getField(['Estimated Value', 'Tender Value']);
          const estimatedValue = estimatedValueStr ? Math.round(parseFloat(estimatedValueStr.toString().replace(/[^0-9.-]/g, '') || "0") * 100) : null;
          const marginalDifference = (contractValue && estimatedValue) ? (contractValue - estimatedValue) : null;
          const participatorBiddersStr = getField(['Participator Bidders', 'Bidders']);
          const participatorBidders = participatorBiddersStr ? 
            participatorBiddersStr.split(/[,;]/).map((b: string) => b.trim()).filter((b: string) => b) : [];
          
          // Determine status
          let status = 'missed_opportunity';
          const isAppentusWinner = awardedTo.toLowerCase().includes('appentus');
          const isAppentusParticipant = participatorBidders.some(b => b.toLowerCase().includes('appentus'));
          
          if (isAppentusWinner) {
            status = 'won';
          } else if (isAppentusParticipant) {
            status = 'lost';
          }
          
          // Create the record
          await db.insert(enhancedTenderResults).values({
            tenderTitle,
            organization,
            referenceNo: referenceNo || null,
            location: location || null,
            department: department || null,
            tenderValue: estimatedValue,
            contractValue: contractValue,
            marginalDifference: marginalDifference,
            ourBidValue: isAppentusParticipant ? contractValue : null,
            status,
            awardedTo: awardedTo || null,
            awardedValue: contractValue,
            participatorBidders: participatorBidders.length > 0 ? participatorBidders : null,
            resultDate: new Date(),
            assignedTo: (isAppentusWinner || isAppentusParticipant) ? 'Appentus' : null,
            reasonForLoss: (isAppentusParticipant && !isAppentusWinner) ? 'Lost to competitor' : null,
            missedReason: status === 'missed_opportunity' ? 'Not assigned to any bidder' : null,
            companyEligible: true,
            aiMatchScore: isAppentusWinner ? 100 : (isAppentusParticipant ? 85 : 70),
            notes: null,
            link: null
          });
          
          successCount++;
          
          if (totalProcessed % 100 === 0) {
            console.log(`Progress: ${totalProcessed} rows processed, ${successCount} imported`);
          }
          
        } catch (error: any) {
          errorCount++;
          errors.push(`Row ${totalProcessed}: ${error.message}`);
          if (errorCount <= 10) {
            console.error(`Error processing row ${totalProcessed}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n=== Import Complete ===');
    console.log(`Total rows processed: ${totalProcessed}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\nFirst 10 errors:');
      errors.slice(0, 10).forEach(err => console.log(err));
    }
    
    // Verify import
    const result = await db.select().from(enhancedTenderResults);
    console.log(`\nTotal records in database: ${result.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

importExcelFile();
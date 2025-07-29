import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { storage } from './storage';

export async function processTenderExcelFile(filePath: string) {
  try {
    console.log(`Processing tender Excel file: ${filePath}`);
    
    // Read the Excel file
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    let totalProcessed = 0;
    let totalSkipped = 0;
    
    // Process each worksheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (!data || data.length === 0) continue;
      
      console.log(`Processing sheet: ${sheetName} with ${data.length} rows`);
      
      // Process each row
      for (const row of data) {
        try {
          const r = row as any;
          
          // Helper function to get field value
          const getField = (fieldNames: string[]) => {
            for (const name of fieldNames) {
              if (r[name] !== undefined && r[name] !== null && r[name] !== '') {
                return String(r[name]).trim();
              }
            }
            return "";
          };
          
          // Extract tender data
          const title = getField(['Title', 'Tender Title', 'Work Description', 'Work Name', 'Brief Description', 'TENDER BRIEF']);
          if (!title) continue; // Skip rows without title
          
          const organization = getField(['Organization', 'Dept', 'Department', 'Ministry', 'Company', 'OWNERSHIP']);
          const location = getField(['Location', 'City', 'State', 'Region', 'LOCATION']);
          
          // For Active Tenders, Reference No is specifically in column C
          // First try the normal field names
          let referenceNo = getField(['REFERENCE NO', 'Reference No', 'Ref No', 'ID', 'T247 ID', 'Tender ID', 'Reference', 'TENDER REFERENCE NO']);
          
          // If not found, check column C specifically (which might be __EMPTY_1 or other labels)
          if (!referenceNo) {
            // In Excel, columns without headers are often labeled as __EMPTY, __EMPTY_1, etc.
            // Column A = no label or __EMPTY, Column B = __EMPTY or __EMPTY_1, Column C = __EMPTY_1 or __EMPTY_2
            if (r['__EMPTY_1'] !== undefined && r['__EMPTY_1'] !== null && r['__EMPTY_1'] !== '') {
              referenceNo = String(r['__EMPTY_1']).trim();
            } else if (r['__EMPTY_2'] !== undefined && r['__EMPTY_2'] !== null && r['__EMPTY_2'] !== '') {
              referenceNo = String(r['__EMPTY_2']).trim();
            }
          }
          
          // Parse value
          let value = 0;
          const valueStr = getField(['Value', 'Amount', 'Tender Value', 'Estimated Value', 'VALUE']);
          if (valueStr) {
            const numStr = valueStr.replace(/[^0-9.-]/g, '');
            value = parseFloat(numStr) || 0;
            // Convert to cents
            value = value * 100;
          }
          
          // Parse deadline
          let deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
          const deadlineStr = getField(['Deadline', 'Due Date', 'Closing Date', 'Last Date', 'DEADLINE']);
          if (deadlineStr) {
            const parsedDate = new Date(deadlineStr);
            if (!isNaN(parsedDate.getTime())) {
              deadline = parsedDate;
            }
          }
          
          // Extract turnover requirement
          const turnoverStr = getField(['Turnover', 'Eligibility', 'Annual Turnover', 'TURNOVER']);
          
          // Determine source
          const source = referenceNo.toLowerCase().includes('gem') ? 'gem' : 'non_gem';
          
          // Extract link
          const link = getField(['Link', 'URL', 'Tender Link', 'Website', 'LINK']);
          
          // Create tender
          const tender = await storage.createTender({
            title,
            organization,
            description: null,
            value,
            deadline,
            status: 'active',
            source,
            location,
            referenceNo,
            link: link || null,
            requirements: {
              turnover: turnoverStr || "",
              referenceNo: referenceNo || "",
              location: location || ""
            }
          });
          
          // Calculate AI score if company settings exist
          const companySettings = await storage.getCompanySettings();
          if (companySettings) {
            const aiScore = await storage.calculateAIMatch(tender, companySettings);
            await storage.updateTender(tender.id, { aiScore });
          }
          
          totalProcessed++;
          console.log(`Processed tender: ${title} (Ref: ${referenceNo || 'N/A'})`);
          
        } catch (error) {
          console.error(`Error processing row:`, error);
          totalSkipped++;
        }
      }
    }
    
    console.log(`Tender processing complete. Processed: ${totalProcessed}, Skipped: ${totalSkipped}`);
    return { processed: totalProcessed, skipped: totalSkipped };
    
  } catch (error) {
    console.error('Error processing tender Excel file:', error);
    throw error;
  }
}

// Process specific file if provided as command line argument
if (process.argv[2]) {
  processTenderExcelFile(process.argv[2])
    .then(result => {
      console.log('Processing complete:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Processing failed:', error);
      process.exit(1);
    });
}
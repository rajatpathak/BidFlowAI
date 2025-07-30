import * as XLSX from 'xlsx';
import * as fs from 'fs';

// Analyze active tenders Excel file structure
export function analyzeActiveTendersStructure(filePath: string) {
  try {
    console.log(`Analyzing Active Tenders Excel file: ${filePath}`);
    
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    
    console.log('Sheet Names:', workbook.SheetNames);
    console.log(`Total sheets: ${workbook.SheetNames.length}`);
    
    // Analyze each sheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n--- Sheet: ${sheetName} ---`);
      const worksheet = workbook.Sheets[sheetName];
      
      // Get raw data with headers
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log(`Rows: ${rawData.length}`);
      
      if (rawData.length > 0) {
        console.log('Headers (Row 0):', rawData[0]);
        
        // Check for actual header row (might be on row 1 or 2)
        for (let i = 0; i < Math.min(3, rawData.length); i++) {
          const row = rawData[i] as any[];
          if (row && row.length > 0) {
            console.log(`Sample Row ${i}:`, row.slice(0, 6)); // First 6 columns
          }
        }
        
        // Look for common tender column patterns
        const possibleHeaders = ['Title', 'Organization', 'Value', 'Deadline', 'Location', 'Department', 'EMD', 'Reference'];
        for (let i = 0; i < Math.min(3, rawData.length); i++) {
          const row = rawData[i] as any[];
          if (row) {
            const matchingHeaders = possibleHeaders.filter(header => 
              row.some(cell => cell && cell.toString().toLowerCase().includes(header.toLowerCase()))
            );
            if (matchingHeaders.length > 2) {
              console.log(`Row ${i} likely contains headers:`, matchingHeaders);
            }
          }
        }
      }
    }
    
    return {
      success: true,
      sheetNames: workbook.SheetNames,
      analysis: 'Complete'
    };
  } catch (error) {
    console.error('Error analyzing Excel file:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test with the provided active tenders file
const filePath = '../attached_assets/Tenders-(07-28-2025)_1753884258674.xlsx';
analyzeActiveTendersStructure(filePath);
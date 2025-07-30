import * as XLSX from 'xlsx';
import * as fs from 'fs';

// Test hyperlink extraction from Excel files
export function testHyperlinkExtraction(filePath: string) {
  try {
    console.log(`Testing hyperlink extraction from: ${filePath}`);
    
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    
    console.log('Sheet Names:', workbook.SheetNames);
    
    // Analyze first sheet for sample data
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
    console.log('\nFirst 10 rows of data:');
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i] as any[];
      console.log(`Row ${i}:`, row?.slice(0, 5)); // Show first 5 columns
    }
    
    // Look for any hyperlinks in the data
    console.log('\nLooking for hyperlinks...');
    for (let i = 1; i < Math.min(20, rawData.length); i++) {
      const row = rawData[i] as any[];
      if (row && row.length > 0) {
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string' && (cell.includes('http') || cell.includes('www'))) {
            console.log(`Found potential link at Row ${i}, Col ${j}:`, cell);
          }
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error testing hyperlink extraction:', error);
    return { success: false, error: error.message };
  }
}

// Test with the provided file
const filePath = '../attached_assets/Results-(07-29-2025)_1753884230517.xlsx';
testHyperlinkExtraction(filePath);
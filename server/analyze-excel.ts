import * as XLSX from 'xlsx';
import * as fs from 'fs';

// Analyze Excel file structure for tender results
export function analyzeExcelStructure(filePath: string) {
  try {
    console.log(`Analyzing Excel file: ${filePath}`);
    
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    
    console.log('Sheet Names:', workbook.SheetNames);
    
    // Analyze each sheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n--- Sheet: ${sheetName} ---`);
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Rows: ${data.length}`);
      
      if (data.length > 0) {
        console.log('Column Headers:', Object.keys(data[0]));
        console.log('Sample Row:', data[0]);
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

// Test with the provided file - run directly
const filePath = '../attached_assets/Results-(07-29-2025)_1753884230517.xlsx';
analyzeExcelStructure(filePath);
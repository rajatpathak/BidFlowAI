import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

// Debug script to test Excel data extraction
async function debugExcelFile(filePath: string) {
  console.log('=== DEBUGGING EXCEL FILE ===');
  console.log('File:', filePath);
  
  try {
    const fileBuffer = readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    console.log('Available sheets:', workbook.SheetNames);
    
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n--- SHEET: ${sheetName} ---`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        // Show headers
        console.log('Headers (Row 0):', jsonData[0]);
        
        // Show first few data rows
        console.log('\nFirst 3 data rows:');
        for (let i = 1; i <= Math.min(3, jsonData.length - 1); i++) {
          console.log(`Row ${i}:`, jsonData[i]);
        }
        
        // Test column mapping
        const headers = jsonData[0] as string[];
        const columnMapping = {
          title: headers.findIndex(h => h && (h.includes('TENDER BRIEF') || h.includes('TENDER TITLE') || h.includes('TITLE'))),
          organization: headers.findIndex(h => h && (h.includes('Organization') || h.includes('ORGANISATION') || h.includes('DEPT'))),
          value: headers.findIndex(h => h && (h.includes('Value') || h.includes('COST') || h.includes('AMOUNT'))),
          deadline: headers.findIndex(h => h && (h.includes('Deadline') || h.includes('DATE') || h.includes('CLOSING'))),
          location: headers.findIndex(h => h && (h.includes('LOCATION') || h.includes('PLACE') || h.includes('STATE'))),
          referenceNo: headers.findIndex(h => h && (h.includes('REFERENCE') || h.includes('REF') || h.includes('NO') || h.includes('ID'))),
        };
        
        console.log('\nColumn Mapping:', columnMapping);
        
        // Test data extraction from first row
        if (jsonData.length > 1) {
          const firstRow = jsonData[1] as any[];
          console.log('\nExtracted data from first row:');
          console.log('Title:', firstRow[columnMapping.title]);
          console.log('Organization:', firstRow[columnMapping.organization]);
          console.log('Value:', firstRow[columnMapping.value]);
          console.log('Deadline:', firstRow[columnMapping.deadline]);
          console.log('Location:', firstRow[columnMapping.location]);
          console.log('Reference No:', firstRow[columnMapping.referenceNo]);
        }
      }
    }
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
}

// Test with attached file - check which files are available
import { readdirSync } from 'fs';

try {
  const files = readdirSync('attached_assets').filter(f => f.endsWith('.xlsx'));
  console.log('Available Excel files:', files);
  
  // Find active tenders file specifically
  const tendersFile = files.find(f => f.includes('Tenders-') && !f.includes('Results-'));
  if (tendersFile) {
    console.log(`\nAnalyzing Active Tenders file: ${tendersFile}`);
    debugExcelFile(`attached_assets/${tendersFile}`);
  } else if (files.length > 0) {
    debugExcelFile(`attached_assets/${files[0]}`);
  }
} catch (error) {
  console.error('Error listing files:', error);
}
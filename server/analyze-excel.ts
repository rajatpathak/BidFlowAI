import * as XLSX from 'xlsx';
import fs from 'fs';

const filePath = process.argv[2] || 'attached_assets/Results-(07-29-2025)_1753792177743.xlsx';

console.log(`Analyzing Excel file: ${filePath}`);

try {
  const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
  
  let totalRows = 0;
  let rowsWithData = 0;
  let rowsWithReferenceNo = 0;
  let emptyRows = 0;
  const sheetStats: any[] = [];

  // Process each worksheet
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    
    let sheetRowsWithData = 0;
    let sheetRowsWithRef = 0;
    let sheetEmptyRows = 0;
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      totalRows++;
      
      // Check if row has any data
      const hasData = row.some(cell => cell !== '' && cell !== null && cell !== undefined);
      
      if (hasData) {
        rowsWithData++;
        sheetRowsWithData++;
        
        // Check if row has reference number (usually in column C/index 2)
        const refNo = row[2] || row[1]; // Sometimes it's in column B
        if (refNo && refNo.toString().trim() !== '') {
          rowsWithReferenceNo++;
          sheetRowsWithRef++;
        }
      } else {
        emptyRows++;
        sheetEmptyRows++;
      }
    }
    
    sheetStats.push({
      sheetName,
      totalRows: data.length - 1, // Exclude header
      rowsWithData: sheetRowsWithData,
      rowsWithRef: sheetRowsWithRef,
      emptyRows: sheetEmptyRows
    });
  }
  
  console.log('\n=== Excel File Analysis ===');
  console.log(`Total sheets: ${workbook.SheetNames.length}`);
  console.log(`Total rows (all sheets): ${totalRows}`);
  console.log(`Rows with data: ${rowsWithData}`);
  console.log(`Rows with reference numbers: ${rowsWithReferenceNo}`);
  console.log(`Empty rows: ${emptyRows}`);
  
  console.log('\n=== Sheet-by-Sheet Breakdown ===');
  sheetStats.forEach(sheet => {
    console.log(`\nSheet: ${sheet.sheetName}`);
    console.log(`  Total rows: ${sheet.totalRows}`);
    console.log(`  Rows with data: ${sheet.rowsWithData}`);
    console.log(`  Rows with reference numbers: ${sheet.rowsWithRef}`);
    console.log(`  Empty rows: ${sheet.emptyRows}`);
  });
  
  // Sample some rows to see the data
  console.log('\n=== Sample Data from First Sheet ===');
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const sampleData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, range: 0, defval: '' }) as any[][];
  
  console.log('Header row:', sampleData[0]);
  console.log('\nFirst 5 data rows:');
  for (let i = 1; i <= Math.min(5, sampleData.length - 1); i++) {
    const row = sampleData[i];
    if (row.some(cell => cell !== '')) {
      console.log(`Row ${i}: Reference No: ${row[2] || row[1] || 'N/A'}, Title: ${row[0] || 'N/A'}`);
    }
  }
  
} catch (error) {
  console.error('Error analyzing Excel file:', error);
}
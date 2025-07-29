import * as XLSX from 'xlsx';
import * as fs from 'fs';
import path from 'path';

async function testHyperlinkExtraction() {
  console.log("Testing hyperlink extraction from Excel files...\n");
  
  // Find an uploaded Excel file
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.xlsx'));
  
  if (files.length === 0) {
    console.log("No Excel files found in uploads directory");
    return;
  }
  
  const testFile = files[0];
  console.log(`Testing with file: ${testFile}\n`);
  
  // Read the Excel file with hyperlink support
  const workbook = XLSX.read(fs.readFileSync(path.join(uploadsDir, testFile)), { 
    type: 'buffer',
    cellHTML: true,
    cellNF: true,
    cellStyles: true
  });
  
  // Process first worksheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log(`Processing sheet: ${sheetName}`);
  console.log(`Worksheet has links array: ${!!worksheet['!links']}`);
  
  // Get data as array of arrays
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (data.length === 0) return;
  
  const headers = (data[0] as any[]).map(h => String(h || '').toLowerCase().trim());
  const tenderBriefCol = headers.indexOf('tender brief');
  
  if (tenderBriefCol === -1) {
    console.log("No 'tender brief' column found");
    return;
  }
  
  console.log(`\nTender Brief column index: ${tenderBriefCol}`);
  console.log("\nChecking first 5 rows for hyperlinks:\n");
  
  // Check first 5 data rows
  for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
    const cellAddress = XLSX.utils.encode_cell({r: i, c: tenderBriefCol});
    const cell = worksheet[cellAddress];
    
    console.log(`Row ${i} (${cellAddress}):`);
    console.log(`  Cell value: ${cell ? cell.v : 'undefined'}`);
    console.log(`  Has hyperlink: ${cell && cell.l ? 'YES' : 'NO'}`);
    
    if (cell && cell.l) {
      console.log(`  Hyperlink Target: ${cell.l.Target}`);
      console.log(`  Hyperlink Tooltip: ${cell.l.Tooltip || 'none'}`);
    }
    
    // Also check worksheet links array
    if (worksheet['!links']) {
      const hyperlink = worksheet['!links'].find((l: any) => l.ref === cellAddress);
      if (hyperlink) {
        console.log(`  Found in links array: ${hyperlink.target}`);
      }
    }
    
    console.log('');
  }
  
  // Check if there are any hyperlinks in the entire sheet
  let totalHyperlinks = 0;
  const range = XLSX.utils.decode_range(worksheet['!ref']!);
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
      const cell = worksheet[cellAddress];
      if (cell && cell.l) {
        totalHyperlinks++;
      }
    }
  }
  
  console.log(`\nTotal hyperlinks found in sheet: ${totalHyperlinks}`);
}

// Run the test
testHyperlinkExtraction();
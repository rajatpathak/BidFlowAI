import * as XLSX from 'xlsx';
import * as fs from 'fs';
import path from 'path';
import { DatabaseStorage } from "./database-storage";

async function reprocessExcelWithLinks() {
  console.log("Reprocessing Excel file to extract and save hyperlinks...\n");
  
  const storage = new DatabaseStorage();
  
  // Use the first Excel file in uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.xlsx'));
  
  if (files.length === 0) {
    console.log("No Excel files found");
    return;
  }
  
  const testFile = files[0];
  const filePath = path.join(uploadsDir, testFile);
  console.log(`Processing file: ${testFile}\n`);
  
  // Read Excel with hyperlink support
  const workbook = XLSX.read(fs.readFileSync(filePath), { 
    type: 'buffer',
    cellHTML: true,
    cellNF: true,
    cellStyles: true
  });
  
  // Process first sheet only (as a test)
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Get data
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (data.length < 2) return;
  
  const headers = (data[0] as any[]).map(h => String(h || '').toLowerCase().trim());
  const columnMap = new Map<string, number>();
  
  // Map columns
  headers.forEach((header, index) => {
    if (header.includes('title') || header.includes('tender brief')) columnMap.set('title', index);
    if (header.includes('organization')) columnMap.set('organization', index);
    if (header.includes('value')) columnMap.set('value', index);
    if (header.includes('deadline')) columnMap.set('deadline', index);
    if (header.includes('location')) columnMap.set('location', index);
    if (header.includes('reference')) columnMap.set('reference', index);
    if (header.includes('tender brief')) columnMap.set('tender brief', index);
  });
  
  // Process first 5 rows to test
  let updatedCount = 0;
  for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
    const row = data[i] as any[];
    if (!row || row.length === 0) continue;
    
    const title = row[columnMap.get('title')!] || '';
    if (!title) continue;
    
    // Extract hyperlink
    let link = '';
    if (columnMap.has('tender brief')) {
      const briefCol = columnMap.get('tender brief')!;
      const briefCell = worksheet[XLSX.utils.encode_cell({r: i, c: briefCol})];
      
      if (briefCell && briefCell.l) {
        link = briefCell.l.Target || '';
      }
    }
    
    if (link) {
      console.log(`Row ${i}: Found link for "${title.substring(0, 50)}..."`);
      console.log(`  Link: ${link}`);
      
      // Find and update existing tender by title
      const tenders = await storage.getTenders();
      const matchingTender = tenders.find(t => 
        t.title.toLowerCase().trim() === title.toLowerCase().trim()
      );
      
      if (matchingTender) {
        const requirements = (matchingTender.requirements as any) || {};
        requirements.link = link;
        
        await storage.updateTender(matchingTender.id, {
          requirements: requirements
        });
        
        console.log(`  ✓ Updated tender ${matchingTender.id}`);
        updatedCount++;
      } else {
        console.log(`  ✗ No matching tender found in database`);
      }
    }
  }
  
  console.log(`\nUpdated ${updatedCount} tenders with links`);
  
  // Verify updates
  console.log("\nVerifying updates...");
  const tendersWithLinks = await storage.getTenders();
  const withLinks = tendersWithLinks.filter(t => {
    const req = t.requirements as any;
    return req && req.link && req.link.length > 0;
  });
  console.log(`Total tenders with links: ${withLinks.length}`);
  
  process.exit(0);
}

reprocessExcelWithLinks();
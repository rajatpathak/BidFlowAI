import * as XLSX from 'xlsx';
import * as fs from 'fs';
import path from 'path';
import { DatabaseStorage } from "./database-storage";

async function updateAllTenderLinks() {
  console.log("Starting to update all tender links from Excel files...\n");
  
  const storage = new DatabaseStorage();
  
  // Get all Excel files
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.xlsx'));
  
  console.log(`Found ${files.length} Excel files to process\n`);
  
  let totalLinksFound = 0;
  let totalUpdated = 0;
  
  // Create a map of all tenders by normalized title for faster lookup
  const allTenders = await storage.getTenders();
  const tenderMap = new Map();
  
  allTenders.forEach(tender => {
    const normalizedTitle = tender.title.toLowerCase().trim();
    tenderMap.set(normalizedTitle, tender);
  });
  
  // Process each Excel file
  for (const file of files) {
    console.log(`\nProcessing: ${file}`);
    const filePath = path.join(uploadsDir, file);
    
    try {
      const workbook = XLSX.read(fs.readFileSync(filePath), { 
        type: 'buffer',
        cellHTML: true,
        cellNF: true,
        cellStyles: true
      });
      
      // Process each worksheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (data.length < 2) continue;
        
        const headers = (data[0] as any[]).map(h => String(h || '').toLowerCase().trim());
        const columnMap = new Map<string, number>();
        
        // Map columns
        headers.forEach((header, index) => {
          if (header.includes('title') || header.includes('tender brief')) columnMap.set('title', index);
          if (header.includes('tender brief')) columnMap.set('tender brief', index);
        });
        
        if (!columnMap.has('tender brief')) continue;
        
        // Process each row
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0) continue;
          
          const title = row[columnMap.get('title')!] || '';
          if (!title) continue;
          
          // Extract hyperlink
          const briefCol = columnMap.get('tender brief')!;
          const briefCell = worksheet[XLSX.utils.encode_cell({r: i, c: briefCol})];
          
          if (briefCell && briefCell.l && briefCell.l.Target) {
            const link = briefCell.l.Target;
            totalLinksFound++;
            
            // Find matching tender
            const normalizedTitle = title.toLowerCase().trim();
            const matchingTender = tenderMap.get(normalizedTitle);
            
            if (matchingTender) {
              const requirements = (matchingTender.requirements as any) || {};
              
              // Only update if no link exists
              if (!requirements.link) {
                requirements.link = link;
                
                await storage.updateTender(matchingTender.id, {
                  requirements: requirements
                });
                
                totalUpdated++;
                if (totalUpdated % 100 === 0) {
                  console.log(`  Progress: ${totalUpdated} tenders updated...`);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total hyperlinks found: ${totalLinksFound}`);
  console.log(`Total tenders updated: ${totalUpdated}`);
  
  // Final verification
  const tendersWithLinks = allTenders.filter(t => {
    const req = t.requirements as any;
    return req && req.link && req.link.length > 0;
  });
  
  console.log(`\nFinal verification:`);
  console.log(`Total tenders in database: ${allTenders.length}`);
  console.log(`Tenders with links: ${tendersWithLinks.length + totalUpdated}`);
  
  process.exit(0);
}

updateAllTenderLinks();
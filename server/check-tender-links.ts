import { DatabaseStorage } from "./database-storage";

async function checkTenderLinks() {
  const storage = new DatabaseStorage();
  
  try {
    const tenders = await storage.getTenders();
    const tendersWithLinks = tenders.filter(t => {
      const req = t.requirements as any;
      return req && req.link && req.link.length > 0;
    });
    
    console.log(`Total tenders: ${tenders.length}`);
    console.log(`Tenders with links: ${tendersWithLinks.length}`);
    
    if (tendersWithLinks.length > 0) {
      console.log(`\nFirst 5 tenders with links:`);
      tendersWithLinks.slice(0, 5).forEach((tender, index) => {
        console.log(`\n${index + 1}. ${tender.title.substring(0, 60)}...`);
        console.log(`   Link: ${(tender.requirements as any).link}`);
      });
    } else {
      console.log("\nNo tenders found with links. Checking first 5 tenders:");
      tenders.slice(0, 5).forEach((tender, index) => {
        console.log(`\n${index + 1}. ${tender.title.substring(0, 60)}...`);
        console.log(`   Requirements:`, tender.requirements);
      });
    }
  } catch (error) {
    console.error("Error checking tender links:", error);
  }
  
  process.exit(0);
}

checkTenderLinks();
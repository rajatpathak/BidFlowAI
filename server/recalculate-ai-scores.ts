import { DatabaseStorage } from "./database-storage";

async function recalculateAIScores() {
  console.log("Starting AI score recalculation for all tenders...");
  
  const storage = new DatabaseStorage();
  
  try {
    // Get company settings
    const companySettings = await storage.getCompanySettings();
    if (!companySettings) {
      console.error("No company settings found. Please configure company settings first.");
      return;
    }
    
    // Get all tenders
    const tenders = await storage.getTenders();
    console.log(`Found ${tenders.length} tenders to process`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each tender
    for (const tender of tenders) {
      try {
        const aiScore = await storage.calculateAIMatch(tender, companySettings);
        await storage.updateTender(tender.id, { aiScore });
        successCount++;
        console.log(`✓ Updated tender "${tender.title.substring(0, 50)}..." with AI score: ${aiScore}%`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to update tender "${tender.title.substring(0, 50)}...":`, error);
      }
    }
    
    console.log(`\nRecalculation complete!`);
    console.log(`Successfully updated: ${successCount} tenders`);
    console.log(`Failed: ${errorCount} tenders`);
    
  } catch (error) {
    console.error("Fatal error during recalculation:", error);
  }
  
  process.exit(0);
}

// Run the recalculation
recalculateAIScores();
import { db } from "./db";
import { sql } from "drizzle-orm";

// Script to remove duplicate tenders keeping only the latest one for each title
async function clearDuplicates() {
  try {
    console.log("🧹 Starting duplicate cleanup...");
    
    // Get total count before cleanup
    const totalBefore = await db.execute(sql`SELECT COUNT(*) as count FROM tenders`);
    console.log(`Total tenders before cleanup: ${totalBefore[0].count}`);
    
    // Delete duplicates, keeping only the first inserted record for each title
    const result = await db.execute(sql`
      DELETE FROM tenders 
      WHERE id NOT IN (
        SELECT DISTINCT ON (title) id 
        FROM tenders 
        ORDER BY title, created_at ASC
      )
    `);
    
    console.log(`Deleted ${result.rowCount} duplicate records`);
    
    // Get total count after cleanup  
    const totalAfter = await db.execute(sql`SELECT COUNT(*) as count FROM tenders`);
    console.log(`Total tenders after cleanup: ${totalAfter[0].count}`);
    
    // Show remaining duplicates (should be 0)
    const remainingDuplicates = await db.execute(sql`
      SELECT COUNT(*) as duplicates_by_title
      FROM (
        SELECT title, COUNT(*) as count
        FROM tenders 
        GROUP BY title 
        HAVING COUNT(*) > 1
      ) subquery
    `);
    
    console.log(`Remaining duplicate titles: ${remainingDuplicates[0].duplicates_by_title}`);
    console.log("✅ Duplicate cleanup completed!");
    
  } catch (error) {
    console.error("❌ Error clearing duplicates:", error);
  }
}

clearDuplicates();
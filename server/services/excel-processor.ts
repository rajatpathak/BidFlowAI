import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { createConnection } from 'mysql2/promise';

export interface ProcessedTender {
  id: string;
  title: string;
  organization: string;
  value: number;
  deadline: Date;
  location?: string;
  referenceNo?: string;
  source: 'gem' | 'non_gem';
  link?: string;
}

export interface ProcessedTenderResult {
  tenderTitle: string;
  organization: string;
  referenceNo?: string;
  location?: string;
  department?: string;
  tenderValue?: number;
  contractValue?: number;
  awardedTo?: string;
  awardedValue?: number;
  participatorBidders: string[];
  resultDate: Date;
  status: string;
  link?: string;
}

export class ExcelProcessor {
  
  // Clean and extract text from Excel cell
  private cleanText(value: any): string {
    if (!value) return '';
    return String(value).trim().replace(/\s+/g, ' ');
  }

  // Parse numeric value from text
  private parseNumber(value: any): number {
    if (!value) return 0;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Parse date from various formats
  private parseDate(value: any): Date {
    if (!value) return new Date();
    
    // If it's already a date
    if (value instanceof Date) return value;
    
    // Try to parse string date
    const dateStr = String(value).trim();
    const parsed = new Date(dateStr);
    
    // If invalid date, return current date
    if (isNaN(parsed.getTime())) {
      return new Date();
    }
    
    return parsed;
  }

  // Get database connection
  private async getConnection() {
    return await createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'bms_db',
      port: parseInt(process.env.DATABASE_PORT || '3306')
    });
  }

  // Generate unique ID for tender based on content
  private generateTenderID(title: string, organization: string, referenceNo?: string): string {
    const base = referenceNo || `${title.substring(0, 20)}-${organization.substring(0, 10)}`;
    return base.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
  }

  // Get field value from row with multiple possible column names
  private getFieldValue(row: any, fieldNames: string[]): string {
    for (const fieldName of fieldNames) {
      if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
        return this.cleanText(row[fieldName]);
      }
    }
    return '';
  }

  // Parse array from string (for participator bidders)
  private parseArrayFromString(value: any): string[] {
    if (!value) return [];
    
    let str = String(value).trim();
    
    // If it looks like JSON array, try to parse
    if (str.startsWith '[') && str.endsWith(']')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).trim()).filter(item => item.length > 0);
        }
      } catch (e) {
        // Fall back to splitting
      }
    }
    
    // Split by common delimiters
    return str.split(/[,;|]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  // Process Active Tenders Excel file
  async processActiveTendersExcel(filePath: string, uploadedBy: string): Promise<{
    success: boolean;
    tendersProcessed: number;
    duplicatesSkipped: number;
    error?: string;
  }> {
    try {
      const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
      let totalProcessed = 0;
      let totalDuplicates = 0;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        if (!data || data.length === 0) continue;

        for (const row of data) {
          try {
            const r = row as any;
            
            // Extract tender data with flexible column matching
            const title = this.getFieldValue(r, [
              'Title', 'Tender Title', 'Work Description', 'Work Name', 
              'Brief Description', 'Description', 'Subject'
            ]);
            
            if (!title) continue; // Skip empty rows
            
            const organization = this.getFieldValue(r, [
              'Organization', 'Dept', 'Department', 'Ministry', 
              'Company', 'Ownership', 'Client'
            ]);
            
            const referenceNo = this.getFieldValue(r, [
              'Reference No', 'Ref No', 'ID', 'Tender ID', 
              'Reference', 'TR247 ID', 'T247 ID'
            ]);
            
            const location = this.getFieldValue(r, [
              'Location', 'City', 'State', 'Region', 'Place'
            ]);
            
            const valueStr = this.getFieldValue(r, [
              'Value', 'Tender Value', 'EMD', 'Estimated Value', 
              'Budget', 'Amount', 'Cost'
            ]);
            
            const deadlineStr = this.getFieldValue(r, [
              'Deadline', 'Due Date', 'End Date', 'Submission Date',
              'Last Date', 'Closing Date'
            ]);
            
            const link = this.getFieldValue(r, [
              'Link', 'URL', 'Website', 'Tender Link'
            ]);
            
            // Process the data
            const value = this.parseNumber(valueStr) * 100; // Convert to cents
            const deadline = this.parseDate(deadlineStr);
            const source = referenceNo.toLowerCase().includes('gem') ? 'gem' : 'non_gem';
            const id = this.generateTenderID(title, organization, referenceNo);
            
            // Check for duplicates
            const existing = await db.select().from(tenders).where(eq(tenders.id, id)).limit(1);
            
            if (existing.length > 0) {
              totalDuplicates++;
              continue;
            }
            
            // Insert tender
            await db.insert(tenders).values({
              id,
              title,
              organization,
              value,
              deadline,
              location: location || null,
              referenceNo: referenceNo || null,
              source,
              status: 'active',
              aiScore: 75, // Default AI score
              requirements: [],
              documents: [],
              link: link || null
            });
            
            totalProcessed++;
            
          } catch (error) {
            console.log(`Error processing tender row:`, error);
            continue; // Skip problematic rows
          }
        }
      }
      
      return {
        success: true,
        tendersProcessed: totalProcessed,
        duplicatesSkipped: totalDuplicates
      };
      
    } catch (error) {
      return {
        success: false,
        tendersProcessed: 0,
        duplicatesSkipped: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Process Tender Results Excel file
  async processTenderResultsExcel(filePath: string, uploadedBy: string): Promise<{
    success: boolean;
    resultsProcessed: number;
    duplicatesSkipped: number;
    error?: string;
  }> {
    try {
      const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
      let totalProcessed = 0;
      let totalDuplicates = 0;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        if (!data || data.length === 0) continue;

        for (const row of data) {
          try {
            const r = row as any;
            
            // Extract tender result data
            const tenderTitle = this.getFieldValue(r, [
              'Title', 'Tender Title', 'Work Description', 'Work Name',
              'Brief Description', 'TENDER RESULT BRIEF', 'Result Brief'
            ]);
            
            if (!tenderTitle) continue; // Skip empty rows
            
            const organization = this.getFieldValue(r, [
              'Organization', 'Dept', 'Department', 'Ministry', 
              'Company', 'Ownership'
            ]);
            
            const referenceNo = this.getFieldValue(r, [
              'Reference No', 'Ref No', 'ID', 'Tender ID', 
              'Reference', 'TR247 ID', 'T247 ID', 'TENDER REFERENCE NO'
            ]);
            
            const location = this.getFieldValue(r, [
              'Location', 'City', 'State', 'Region', 'LOCATION'
            ]);
            
            const department = this.getFieldValue(r, [
              'Department', 'Dept', 'Division', 'Unit'
            ]);
            
            const awardedTo = this.getFieldValue(r, [
              'Awarded To', 'Winner', 'Selected Company', 'L1 Bidder',
              'Contract Awarded To', 'Winner bidder'
            ]);
            
            const contractValueStr = this.getFieldValue(r, [
              'Contract Value', 'Awarded Value', 'Winning Amount',
              'Final Value', 'L1 Amount'
            ]);
            
            const tenderValueStr = this.getFieldValue(r, [
              'Tender Value', 'Estimated Value', 'EMD', 'Budget'
            ]);
            
            const participatorBiddersStr = this.getFieldValue(r, [
              'Participator Bidders', 'Bidders', 'Participants',
              'Companies', 'Participator Bidders'
            ]);
            
            const resultDateStr = this.getFieldValue(r, [
              'Result Date', 'Award Date', 'Date of Award',
              'Contract Date', 'Last Updated on', 'End Submission date'
            ]);
            
            const link = this.getFieldValue(r, [
              'Link', 'URL', 'Tender Link', 'Website', 'LINK'
            ]);
            
            // Process the data
            const contractValue = this.parseNumber(contractValueStr) * 100; // Convert to cents
            const tenderValue = this.parseNumber(tenderValueStr) * 100;
            const participatorBidders = this.parseArrayFromString(participatorBiddersStr);
            const resultDate = this.parseDate(resultDateStr);
            
            // Determine status based on Appentus involvement
            let status = 'missed_opportunity';
            const isAppentusWinner = awardedTo.toLowerCase().includes('appentus');
            const isAppentusParticipant = participatorBidders.some(bidder => 
              bidder.toLowerCase().includes('appentus')
            );
            
            if (isAppentusWinner) {
              status = 'won';
            } else if (isAppentusParticipant) {
              status = 'lost';
            }
            
            // Generate unique ID for result
            const resultId = this.generateTenderID(tenderTitle, organization, referenceNo);
            
            // Check for duplicates
            const existing = await db.select()
              .from(enhancedTenderResults)
              .where(eq(enhancedTenderResults.id, resultId))
              .limit(1);
            
            if (existing.length > 0) {
              totalDuplicates++;
              continue;
            }
            
            // Insert tender result
            await db.insert(enhancedTenderResults).values({
              id: resultId,
              tenderTitle,
              organization,
              referenceNo: referenceNo || null,
              location: location || null,
              department: department || null,
              tenderValue: tenderValue || null,
              contractValue: contractValue || null,
              marginalDifference: contractValue && tenderValue ? contractValue - tenderValue : null,
              tenderStage: null,
              ourBidValue: isAppentusParticipant ? contractValue : null,
              status,
              awardedTo: awardedTo || null,
              awardedValue: contractValue || null,
              participatorBidders,
              resultDate,
              assignedTo: isAppentusWinner || isAppentusParticipant ? 'Appentus' : null,
              reasonForLoss: isAppentusParticipant && !isAppentusWinner ? 'Lost to competitor' : null,
              missedReason: status === 'missed_opportunity' ? 'Not assigned to any bidder' : null,
              companyEligible: true,
              aiMatchScore: isAppentusWinner ? 100 : (isAppentusParticipant ? 85 : 30),
              notes: null,
              link: link || null
            });
            
            totalProcessed++;
            
          } catch (error) {
            console.log(`Error processing result row:`, error);
            continue; // Skip problematic rows
          }
        }
      }
      
      return {
        success: true,
        resultsProcessed: totalProcessed,
        duplicatesSkipped: totalDuplicates
      };
      
    } catch (error) {
      return {
        success: false,
        resultsProcessed: 0,
        duplicatesSkipped: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const excelProcessor = new ExcelProcessor();
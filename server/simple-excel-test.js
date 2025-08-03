import XLSX from 'xlsx';

// Quick test to see what's in the Excel file
async function testExcelRead() {
  try {
    const filePath = 'attached_assets/Tenders-(07-29-2025)_1754192343697.xlsx';
    console.log('🔍 Testing Excel file read...');
    
    const workbook = XLSX.readFile(filePath);
    console.log('📊 Sheet names:', workbook.SheetNames);
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('📋 Total rows:', rawData.length);
    console.log('📋 First row keys:', Object.keys(rawData[0] || {}));
    console.log('📋 First 3 rows:', rawData.slice(0, 3));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExcelRead();
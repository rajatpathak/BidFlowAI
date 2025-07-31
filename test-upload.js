// Test a simple upload with just a few rows
const XLSX = require('xlsx');
const fs = require('fs');

const testData = [
  ['SR. NO.', 'T247 ID', 'REFERENCE NO', 'TENDER BRIEF', 'ESTIMATED COST'],
  [1, 'T247-001', 'REF-001', 'Software Development Project', '5000000'],
  [2, 'T247-002', 'REF-002', 'Web Application Development', '3000000'],
  [3, 'T247-003', 'REF-003', 'Mobile App Development', '2000000']
];

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(testData);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Non-GeM Tenders');

XLSX.writeFile(workbook, 'test-upload.xlsx');
console.log('Test file created: test-upload.xlsx');
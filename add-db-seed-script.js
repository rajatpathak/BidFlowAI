#!/usr/bin/env node
// Script to add the missing db:seed script to package.json
import { readFileSync, writeFileSync } from 'fs';

console.log('Adding db:seed script to package.json...');

try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  
  // Add the missing db:seed script
  packageJson.scripts['db:seed'] = 'npx tsx scripts/seed-simple.ts';
  
  writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Successfully added db:seed script');
  
  // Show the updated scripts
  console.log('\nUpdated scripts:');
  Object.entries(packageJson.scripts).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
} catch (error) {
  console.error('❌ Failed to update package.json:', error.message);
  process.exit(1);
}
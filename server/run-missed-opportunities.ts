import { processMissedOpportunities } from './missed-opportunities-processor.js';

// Run the missed opportunities processor
processMissedOpportunities()
  .then(result => {
    console.log('Missed opportunities processed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
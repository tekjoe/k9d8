#!/usr/bin/env node
/**
 * Cleanup script to remove city names from street addresses
 * The scraper was appending city names to the street field
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// Get all JSON files
const files = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('-parks.json'))
  .map(f => path.join(dataDir, f));

console.log(`Found ${files.length} park data files to clean up\n`);

let totalFixed = 0;
let totalParks = 0;

files.forEach(file => {
  const stateName = path.basename(file, '-parks.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let fixed = 0;
  
  data.forEach(park => {
    totalParks++;
    if (park.street && park.city) {
      const originalStreet = park.street;
      
      // Remove city name from end of street if present
      // Handle cases where city is concatenated without space
      if (park.street.endsWith(park.city)) {
        park.street = park.street.slice(0, -park.city.length).trim();
        fixed++;
      }
      // Also check if there's a space before the city
      else if (park.street.endsWith(' ' + park.city)) {
        park.street = park.street.slice(0, -(park.city.length + 1)).trim();
        fixed++;
      }
      
      // Clean up any trailing commas or extra spaces
      park.street = park.street.replace(/,\s*$/, '').trim();
    }
  });
  
  if (fixed > 0) {
    // Save cleaned data back
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`✅ ${stateName}: Fixed ${fixed} addresses`);
    totalFixed += fixed;
  }
});

console.log(`\n📊 Summary: Fixed ${totalFixed}/${totalParks} addresses across ${files.length} states`);

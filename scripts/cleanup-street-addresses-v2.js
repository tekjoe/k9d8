#!/usr/bin/env node
/**
 * Comprehensive cleanup script for street addresses
 * Removes city names that were concatenated to street addresses during scraping
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// Common city patterns that appear at end of street addresses
// These are cities commonly found across all states
const commonCities = [
  // California cities (most problematic)
  'Yorba Linda', 'Costa Mesa', 'Irvine', 'Orange', 'Mission Viejo',
  'Westminster', 'Huntington Beach', 'Santa Clarita', 'Lathrop', 'Fremont',
  'Hayward', 'Oakland', 'Berkeley', 'Richmond', 'Walnut Creek', 'Concord',
  'Pleasanton', 'Livermore', 'San Ramon', 'Danville', 'Dublin', 'Brentwood',
  'Antioch', 'Pittsburg', 'Bay Point', 'Martinez', 'Pinole', 'El Cerrito',
  'Albany', 'El Sobrante', 'Kensington', 'North Richmond', 'San Pablo',
  'El Cerrito', 'San Leandro', 'Castro Valley', 'San Lorenzo', 'Ashland',
  'Cherryland', 'Fairview', 'Sunol', 'Altamont', 'Mountain House',
  'Tracy', 'Manteca', 'Stockton', 'Lodi', 'Galt', 'Elk Grove', 'Sacramento',
  'West Sacramento', 'Davis', 'Woodland', 'Vacaville', 'Fairfield', 'Suisun City',
  'Rio Vista', 'Isleton', 'Rancho Cordova', 'Citrus Heights', 'Roseville',
  'Rocklin', 'Lincoln', 'Auburn', 'Grass Valley', 'Nevada City', 'Truckee',
  'South Lake Tahoe', 'Tahoe City', 'Kings Beach', 'Incline Village',
  'Placerville', 'El Dorado Hills', 'Folsom', 'Cameron Park', 'Shingle Springs',
  'Diamond Springs', 'Plymouth', 'Amador City', 'Sutter Creek', 'Jackson',
  'San Andreas', 'Angels Camp', 'Murphys', 'Arnold', 'Bear Valley',
  'Mammoth Lakes', 'June Lake', 'Lee Vining', 'Bridgeport', 'Bodie',
  'Yosemite Valley', 'Wawona', 'El Portal', 'Mariposa', 'Midpines',
  'Catheys Valley', 'Hornitos', 'Bear Valley', 'Coulterville', 'Groveland',
  'Big Oak Flat', 'Moccasin', 'Chinese Camp', 'Jamestown', 'Sonora',
  'Columbia', 'Twain Harte', 'Mi-Wuk Village', 'Pinecrest', 'Long Barn',
  'Cold Springs', 'Strawberry', 'Pinecrest', 'Dodge Ridge', 'Kennedy Meadows',
  // Major metros across all states
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
  'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington',
  'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City',
  'Portland', 'Las Vegas', 'Louisville', 'Baltimore', 'Milwaukee',
  'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Mesa',
  'Kansas City', 'Atlanta', 'Long Beach', 'Colorado Springs', 'Raleigh',
  'Omaha', 'Miami', 'Tampa', 'Minneapolis', 'New Orleans',
  'Cleveland', 'Honolulu', 'Boise', 'Salt Lake City', 'Des Moines',
  'Little Rock', 'Madison', 'Baton Rouge', 'Reno', 'Richmond'
];

// Get all JSON files
const files = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('-parks.json'))
  .map(f => path.join(dataDir, f));

console.log(`Found ${files.length} park data files to clean up\n`);

let totalFixed = 0;
let totalParks = 0;
const fixCounts = {};

files.forEach(file => {
  const stateName = path.basename(file, '-parks.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let fixed = 0;
  
  data.forEach(park => {
    totalParks++;
    if (park.street) {
      const originalStreet = park.street;
      let cleaned = park.street;
      
      // Try to match city names at the end of the street
      // Sort by length (longest first) to match "San Jose" before "San"
      const sortedCities = [...commonCities].sort((a, b) => b.length - a.length);
      
      for (const city of sortedCities) {
        // Check if street ends with this city (case insensitive)
        const cityPattern = new RegExp(city.replace(/\s+/g, '\\s*') + '$', 'i');
        if (cityPattern.test(cleaned)) {
          cleaned = cleaned.replace(cityPattern, '').trim();
          fixed++;
          fixCounts[city] = (fixCounts[city] || 0) + 1;
          break; // Only remove one city name
        }
      }
      
      // Clean up trailing punctuation and spaces
      cleaned = cleaned.replace(/[,\s]+$/, '').trim();
      
      if (cleaned !== originalStreet) {
        park.street = cleaned;
      }
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

// Show top fixed cities
console.log('\n🔧 Top city names removed:');
Object.entries(fixCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([city, count]) => {
    console.log(`   ${city}: ${count}`);
  });

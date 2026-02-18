#!/usr/bin/env node
/**
 * Smart cleanup script for street addresses
 * Removes city names that were concatenated to street addresses during scraping
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// Key city names that appear most frequently at end of addresses
// Sorted by length (longest first) to match multi-word cities first
const cityNames = [
  // Multi-word cities (longest first)
  'Port St. Lucie', 'Port St. Joe', 'Colorado Springs', 'Cedar Rapids', 'Des Moines',
  'Corpus Christi', 'Sioux Falls', 'Sioux City', 'Kansas City', 'New Orleans',
  'Oklahoma City', 'Salt Lake City', 'West Palm Beach', 'Boca Raton', 'Daytona Beach',
  'St. Petersburg', 'Myrtle Beach', 'North Charleston', 'Huntington Beach', 'Santa Clarita',
  'Mission Viejo', 'Yorba Linda', 'Costa Mesa', 'Santa Monica', 'Long Beach',
  'Palm Springs', 'Santa Barbara', 'San Francisco', 'San Diego', 'Los Angeles',
  'San Jose', 'San Antonio', 'El Paso', 'Fort Worth', 'Virginia Beach',
  'New York', 'North Port', 'Royal Oak', 'Mount Pleasant', 'St. Charles',
  'St. Peters', 'St. Louis', 'St. Paul', 'St. Cloud', 'Grand Rapids',
  'Grand Prairie', 'Overland Park', 'Chapel Hill', 'Coral Springs', 'Palm Beach',
  'Miami Beach', 'Fort Myers', 'Port Orange', 'Port Huron', 'Mount Vernon',
  'New Britain', 'New Haven', 'New Brunswick', 'Rapid City', 'Raleigh',
  'Aurora', 'Oakland', 'Tulsa', 'Tucson', 'Tampa',
  'Toledo', 'Tacoma', 'Tallahassee', 'Trenton', 'Troy',
  'Tupelo', 'Tyler', 'Utica', 'Vallejo', 'Vancouver',
  'Ventura', 'Vicksburg', 'Victorville', 'Waco', 'Warren',
  'Washington', 'Waterbury', 'Waterloo', 'Waukegan', 'Waukesha',
  'Westminster', 'Wichita', 'Wilmington', 'Winston-Salem', 'Worcester',
  'Yakima', 'Yonkers', 'Youngstown', 'Yuma',
  // Single word cities (most common)
  'Akron', 'Albany', 'Albuquerque', 'Alexandria', 'Allentown',
  'Amarillo', 'Anaheim', 'Anchorage', 'Ann Arbor', 'Annapolis',
  'Arlington', 'Arvada', 'Athens', 'Atlanta', 'Augusta',
  'Aurora', 'Austin', 'Bakersfield', 'Baltimore', 'Baton Rouge',
  'Beaumont', 'Bellevue', 'Bend', 'Berkeley', 'Billings',
  'Birmingham', 'Bismarck', 'Boise', 'Boston', 'Boulder',
  'Bozeman', 'Bremerton', 'Bridgeport', 'Brighton', 'Brownsville',
  'Buffalo', 'Burbank', 'Burlington', 'Cambridge', 'Canton',
  'Carlsbad', 'Carmel', 'Cary', 'Cedar Park', 'Chandler',
  'Charleston', 'Charlotte', 'Chattanooga', 'Chesapeake', 'Cheyenne',
  'Chicago', 'Chico', 'Cincinnati', 'Cleveland', 'Clovis',
  'Cody', 'College Station', 'Colorado', 'Columbia', 'Columbus',
  'Concord', 'Coral', 'Corona', 'Corpus', 'Costa',
  'Dallas', 'Daly', 'Dayton', 'Dearborn', 'Decatur',
  'Denver', 'Desoto', 'Detroit', 'Downey', 'Duluth',
  'Durham', 'Edison', 'Elgin', 'Elizabeth', 'Elk',
  'Erie', 'Eugene', 'Evansville', 'Everett', 'Fairfield',
  'Fargo', 'Fayetteville', 'Fontana', 'Fort', 'Fremont',
  'Fresno', 'Frisco', 'Fullerton', 'Gainesville', 'Garden',
  'Garland', 'Gilbert', 'Glendale', 'Grand', 'Greensboro',
  'Greenville', 'Gresham', 'Gulfport', 'Hampton', 'Harrisburg',
  'Hartford', 'Hayward', 'Helena', 'Henderson', 'Hialeah',
  'Highland', 'Hollywood', 'Honolulu', 'Houston', 'Huntington',
  'Huntsville', 'Independence', 'Indianapolis', 'Inglewood', 'Irvine',
  'Irving', 'Jackson', 'Jacksonville', 'Jersey', 'Joliet',
  'Kalamazoo', 'Kansas', 'Kenosha', 'Kent', 'Killeen',
  'Knoxville', 'Lafayette', 'Lakeland', 'Lakewood', 'Lancaster',
  'Lansing', 'Laredo', 'Las', 'Lexington', 'Lincoln',
  'Little', 'Livermore', 'Logan', 'Long', 'Louisville',
  'Lowell', 'Lubbock', 'Macon', 'Madison', 'Manchester',
  'Mcallen', 'Memphis', 'Mesa', 'Mesquite', 'Metairie',
  'Miami', 'Midland', 'Milwaukee', 'Minneapolis', 'Miramar',
  'Mobile', 'Modesto', 'Montgomery', 'Moreno', 'Murfreesboro',
  'Naperville', 'Nashville', 'New', 'Newport', 'Norfolk',
  'Norman', 'North', 'Oakland', 'Oceanside', 'Odessa',
  'Ogden', 'Oklahoma', 'Olympia', 'Omaha', 'Ontario',
  'Orange', 'Orlando', 'Overland', 'Oxnard', 'Palm',
  'Pasadena', 'Paterson', 'Peoria', 'Philadelphia', 'Phoenix',
  'Pittsburgh', 'Plano', 'Pomona', 'Pompano', 'Port',
  'Portland', 'Providence', 'Provo', 'Pueblo', 'Raleigh',
  'Ranch', 'Reno', 'Richmond', 'Riverside', 'Roanoke',
  'Rochester', 'Rockford', 'Roseville', 'Round', 'Sacramento',
  'Salem', 'Salinas', 'Salt', 'San', 'Sandy',
  'Santa', 'Savannah', 'Scottsdale', 'Seattle', 'Shreveport',
  'Simi', 'Sioux', 'South', 'Spokane', 'Spring',
  'Springfield', 'St', 'Stamford', 'Sterling', 'Stockton',
  'Sunnyvale', 'Syracuse', 'Tacoma', 'Tallahassee', 'Tampa',
  'Temecula', 'Tempe', 'Thornton', 'Thousand', 'Toledo',
  'Torrance', 'Tucson', 'Tulsa', 'Vallejo', 'Vancouver',
  'Ventura', 'Victorville', 'Virginia', 'Visalia', 'Waco',
  'Warren', 'Washington', 'Waterbury', 'West', 'Westminster',
  'Wichita', 'Wilmington', 'Winston', 'Worcester', 'Yonkers'
].sort((a, b) => b.length - a.length);

// Valid street suffixes - if address ends with these, it's clean
const validSuffixes = [
  'St', 'Street', 'Ave', 'Avenue', 'Blvd', 'Boulevard', 'Dr', 'Drive',
  'Rd', 'Road', 'Ln', 'Lane', 'Way', 'Ct', 'Court', 'Pl', 'Place',
  'Pkwy', 'Parkway', 'Cir', 'Circle', 'Ter', 'Terrace', 'Trl', 'Trail',
  'Hwy', 'Highway', 'Rt', 'Route', 'Pike', 'Pike', 'Run', 'Walk',
  'Pass', 'Crossing', 'Cv', 'Cove', 'Holw', 'Hollow', 'Loop',
  'Park', 'Plz', 'Plaza', 'Pt', 'Point', 'Sq', 'Square',
  'Xing', 'Crossing', 'Alley', 'Aly', 'Anx', 'Annex', 'Arc', 'Arcade',
  'Byu', 'Bayou', 'Bch', 'Beach', 'Bnd', 'Bend', 'Blf', 'Bluff',
  'Blfs', 'Bluffs', 'Bot', 'Bottom', 'Br', 'Branch', 'Brg', 'Bridge',
  'Brk', 'Brook', 'Brks', 'Brooks', 'Btm', 'Bottom', 'Byp', 'Bypass',
  'Cswy', 'Causeway', 'Cyn', 'Canyon', 'Cpe', 'Cape', 'Crk', 'Creek',
  'Crst', 'Crest', 'Cswy', 'Causeway', 'Ct', 'Court', 'Ctr', 'Center',
  'Cts', 'Courts', 'Curv', 'Curve', 'Cvs', 'Coves', 'Cyn', 'Canyon',
  'Dl', 'Dale', 'Dm', 'Dam', 'Dr', 'Drive', 'Drs', 'Drives',
  'Est', 'Estate', 'Ests', 'Estates', 'Exp', 'Expressway', 'Expy', 'Expressway',
  'Ext', 'Extension', 'Exts', 'Extensions', 'Fall', 'Fls', 'Falls',
  'Fld', 'Field', 'Flds', 'Fields', 'Fls', 'Falls', 'Flt', 'Flat',
  'Flts', 'Flats', 'Frd', 'Ford', 'Frds', 'Fords', 'Frg', 'Forge',
  'Frgs', 'Forges', 'Frk', 'Fork', 'Frks', 'Forks', 'Frst', 'Forest',
  'Fry', 'Ferry', 'Ft', 'Fort', 'Fw', 'Freeway', 'Gdn', 'Garden',
  'Gdns', 'Gardens', 'Gln', 'Glen', 'Glns', 'Glens', 'Grn', 'Green',
  'Grns', 'Greens', 'Grv', 'Grove', 'Grvs', 'Groves', 'Gtwy', 'Gateway',
  'Hbr', 'Harbor', 'Hbrs', 'Harbors', 'Hl', 'Hill', 'Hls', 'Hills',
  'Holw', 'Hollow', 'Hts', 'Heights', 'Hvn', 'Haven', 'Hwy', 'Highway',
  'Inlt', 'Inlet', 'Is', 'Island', 'Iss', 'Islands', 'Jct', 'Junction',
  'Jcts', 'Junctions', 'Kn', 'Knoll', 'Knl', 'Knoll', 'Knls', 'Knolls',
  'Ky', 'Key', 'Kys', 'Keys', 'Ldg', 'Lodge', 'Ldge', 'Lodge',
  'Lf', 'Loaf', 'Lk', 'Lake', 'Lks', 'Lakes', 'Lndg', 'Landing',
  'Lndng', 'Landing', 'Ln', 'Lane', 'Lgt', 'Light', 'Lgts', 'Lights',
  'Loc', 'Lock', 'Lcks', 'Locks', 'Mdw', 'Meadow', 'Mdws', 'Meadows',
  'Mews', 'Ml', 'Mill', 'Mls', 'Mills', 'Mnr', 'Manor', 'Mnrs', 'Manors',
  'Msn', 'Mission', 'Mt', 'Mount', 'Mtn', 'Mountain', 'Mtns', 'Mountains',
  'Nck', 'Neck', 'Opas', 'Overpass', 'Orch', 'Orchard', 'Ovl', 'Oval',
  'Park', 'Park', 'Psge', 'Passage', 'Path', 'Paths', 'Pike', 'Pike',
  'Pikes', 'Pine', 'Pnes', 'Pines', 'Pl', 'Place', 'Pln', 'Plain',
  'Plns', 'Plains', 'Plz', 'Plaza', 'Pne', 'Pine', 'Pnes', 'Pines',
  'Pr', 'Prairie', 'Prk', 'Park', 'Prks', 'Parks', 'Prt', 'Port',
  'Prts', 'Ports', 'Psge', 'Passage', 'Pt', 'Point', 'Pts', 'Points',
  'Rdg', 'Ridge', 'Rdgs', 'Ridges', 'Riv', 'River', 'Rnch', 'Ranch',
  'Rnchs', 'Ranches', 'Rpds', 'Rapids', 'Rst', 'Rest', 'Rte', 'Route',
  'Run', 'Shl', 'Shoal', 'Shls', 'Shoals', 'Shr', 'Shore', 'Shrs', 'Shores',
  'Skwy', 'Skyway', 'Smt', 'Summit', 'Spg', 'Spring', 'Spgs', 'Springs',
  'Spur', 'Spurs', 'Sq', 'Square', 'Sqs', 'Squares', 'St', 'Street',
  'Sta', 'Station', 'Stra', 'Stravenue', 'Strm', 'Stream', 'Sts', 'Streets',
  'Ter', 'Terrace', 'Tpke', 'Turnpike', 'Trak', 'Track', 'Trce', 'Trace',
  'Trfy', 'Trafficway', 'Trl', 'Trail', 'Trls', 'Trails', 'Tunl', 'Tunnel',
  'Un', 'Union', 'Uns', 'Unions', 'Upas', 'Underpass', 'Vlg', 'Village',
  'Vlgs', 'Villages', 'Vly', 'Valley', 'Vlys', 'Valleys', 'Vw', 'View',
  'Vws', 'Views', 'Walk', 'Walks', 'Wall', 'Way', 'Ways', 'Well',
  'Wells', 'Wl', 'Well', 'Wls', 'Wells', 'Xing', 'Crossing', 'Xrd', 'Crossroad'
].map(s => s.toLowerCase());

// Get all JSON files
const files = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('-parks.json'))
  .map(f => path.join(dataDir, f));

console.log(`Found ${files.length} park data files to clean up\n`);

let totalFixed = 0;
let totalParks = 0;
const fixCounts = {};

function hasValidSuffix(street) {
  const lower = street.toLowerCase();
  for (const suffix of validSuffixes) {
    if (lower.endsWith(' ' + suffix) || lower === suffix) {
      return true;
    }
  }
  return false;
}

files.forEach(file => {
  const stateName = path.basename(file, '-parks.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let fixed = 0;
  
  data.forEach(park => {
    totalParks++;
    if (park.street && park.street.length > 0) {
      const originalStreet = park.street;
      let cleaned = park.street.trim();
      
      // Skip if already has valid suffix
      if (!hasValidSuffix(cleaned)) {
        // Try to match city names at the end
        for (const city of cityNames) {
          const cityLower = city.toLowerCase();
          const streetLower = cleaned.toLowerCase();
          
          // Check if street ends with this city (case insensitive)
          if (streetLower.endsWith(cityLower)) {
            // Remove the city name
            cleaned = cleaned.slice(0, -city.length).trim();
            fixed++;
            fixCounts[city] = (fixCounts[city] || 0) + 1;
            break; // Only remove one city name
          }
        }
      }
      
      // Clean up trailing punctuation and spaces
      cleaned = cleaned.replace(/[,\s]+$/, '').trim();
      
      if (cleaned !== originalStreet && cleaned.length > 0) {
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
if (Object.keys(fixCounts).length > 0) {
  console.log('\n🔧 Top city names removed:');
  Object.entries(fixCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([city, count]) => {
      console.log(`   ${city}: ${count}`);
    });
}

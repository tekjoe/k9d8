#!/usr/bin/env node
/**
 * Process dogparklist.com JSON data and generate SQL
 * 
 * Usage:
 *   node scripts/process-dogparklist-data.js <input.json> [output.sql]
 *   node scripts/process-dogparklist-data.js scripts/data/tennessee-parks.json
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

// Keywords to detect amenities from descriptions
const AMENITY_KEYWORDS = {
  'waste stations': 'waste_bags',
  'waste station': 'waste_bags',
  'waste bag': 'waste_bags',
  'mutt mitt': 'waste_bags',
  'poop disposal': 'waste_bags',
  'picnic table': 'picnic_tables',
  'bench': 'benches',
  'shade tree': 'shade_trees',
  'trees': 'shade_trees',
  'wooded': 'shade_trees',
  'tree': 'shade_trees',
  'water': 'water_access',
  'drinking fountain': 'water_access',
  'water station': 'water_access',
  'water source': 'water_access',
  'agility': 'agility_equipment',
  'fenced': 'fenced',
  'fenced-in': 'fenced',
  'trails': 'walking_trails',
  'path': 'walking_trails',
  'parking': 'parking',
  'restroom': 'restroom',
  'bathroom': 'restroom',
  'light': 'lighting',
  'separate section': 'separate_areas',
  'small dogs': 'separate_areas',
  'large dogs': 'separate_areas',
};

function detectAmenities(description) {
  if (!description) return [];
  const amenities = [];
  const text = description.toLowerCase();
  
  for (const [keyword, amenity] of Object.entries(AMENITY_KEYWORDS)) {
    if (text.includes(keyword) && !amenities.includes(amenity)) {
      amenities.push(amenity);
    }
  }
  
  return amenities.sort();
}

function detectFenced(description) {
  if (!description) return false;
  const text = description.toLowerCase();
  return text.includes('fenced') || text.includes('fenced-in') || text.includes('enclosed');
}

function detectWater(description) {
  if (!description) return false;
  const text = description.toLowerCase();
  if (text.includes('no water') || text.includes('no running water')) return false;
  return text.includes('water') || text.includes('fountain') || text.includes('lake') || text.includes('pond');
}

function detectShade(description) {
  if (!description) return false;
  const text = description.toLowerCase();
  return text.includes('shade') || text.includes('trees') || text.includes('wooded');
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

function generateSql(parks, stateName) {
  const timestamp = new Date().toISOString();
  const lines = [
    `-- ============================================================`,
    `-- Seed ${stateName} Dog Parks from DogParkList.com`,
    `-- Generated: ${timestamp}`,
    `-- Total parks: ${parks.length}`,
    `-- Source: https://dogparklist.com/parks/`,
    `-- ============================================================`,
    ``,
    `INSERT INTO parks (name, description, latitude, longitude, address, amenities, is_fenced, has_water, has_shade)`,
    `VALUES`
  ];
  
  const values = parks.map((park, index) => {
    const amenities = detectAmenities(park.description);
    const isFenced = detectFenced(park.description);
    const hasWater = detectWater(park.description);
    const hasShade = detectShade(park.description);
    
    const name = escapeSql(park.name);
    const description = escapeSql(park.description);
    const address = escapeSql(`${park.street}, ${park.city}, ${park.state} ${park.zip}`.replace(/, ,/g, ',').trim());
    const amenitiesArray = amenities.length > 0 ? amenities.map(a => `'${a}'`).join(', ') : '';
    
    const isLast = index === parks.length - 1;
    
    return `  ('${name}', '${description}', ${park.latitude || 'NULL'}, ${park.longitude || 'NULL'}, '${address}', ARRAY[${amenitiesArray}]::text[], ${isFenced}, ${hasWater}, ${hasShade})${isLast ? ';' : ','}`;
  });
  
  lines.push(...values);
  lines.push('');
  
  return lines.join('\n');
}

function main() {
  const inputFile = process.argv[2];
  
  if (!inputFile) {
    console.log('Usage: node process-dogparklist-data.js <input.json> [output.sql]');
    console.log('');
    console.log('Examples:');
    console.log('  node process-dogparklist-data.js scripts/data/tennessee-parks.json');
    process.exit(1);
  }
  
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }
  
  // Extract state name from filename
  const basename = path.basename(inputFile, '-parks.json');
  const stateName = basename.charAt(0).toUpperCase() + basename.slice(1);
  
  // Determine output file
  let outputFile;
  if (process.argv[3]) {
    outputFile = path.resolve(process.argv[3]);
  } else {
    // Find next migration number
    const migrations = fs.readdirSync(DEFAULT_OUTPUT_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();
    const lastNum = parseInt(migrations[migrations.length - 1]?.match(/(\d+)/)?.[0] || '0');
    const nextNum = String(lastNum + 1).padStart(5, '0');
    outputFile = path.join(DEFAULT_OUTPUT_DIR, `${nextNum}_seed_${basename}_parks.sql`);
  }
  
  // Read and process
  console.log(`Processing ${basename}...`);
  const parks = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  console.log(`  Found ${parks.length} parks`);
  
  const sql = generateSql(parks, stateName);
  fs.writeFileSync(outputFile, sql, 'utf8');
  
  console.log(`  Generated: ${outputFile}`);
  console.log('  Done!');
}

main();

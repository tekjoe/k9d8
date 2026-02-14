#!/usr/bin/env node
/**
 * Process BringFido JSON data and generate SQL
 *
 * Usage:
 *   1. Save data to scripts/data/bringfido-parks.json (or set INPUT_FILE)
 *   2. Run: node scripts/process-bringfido-data.js
 *
 * Accepted JSON:
 *   - { "results": [...] } or a plain array of park objects
 *   - API style: name, summary, address, latitude, longitude
 *   - JSON-LD style (from page): name, street, city, state, zip, latitude, longitude, description
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_INPUT = path.join(__dirname, 'data/bringfido-parks.json');
const DEFAULT_OUTPUT = path.join(__dirname, '../supabase/migrations/00004_seed_wi_parks.sql');
const INPUT_FILE = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : DEFAULT_INPUT;
const OUTPUT_FILE = process.argv[3] ? path.resolve(process.cwd(), process.argv[3]) : DEFAULT_OUTPUT;

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
  'dip his paws': 'water_access',
  'agility': 'agility_equipment',
  'fenced': 'fenced',
  'fenced-in': 'fenced',
  'trails': 'walking_trails',
  'path': 'walking_trails',
  'pathway': 'walking_trails',
  'parking': 'parking',
  'porta-potty': 'restroom',
  'restroom': 'restroom',
  'bathroom': 'restroom',
  'light': 'lighting',
  'solar light': 'lighting',
  'separate section': 'separate_areas',
  'separate area': 'separate_areas',
  'small dogs': 'separate_areas',
  'large dogs': 'separate_areas',
  'training area': 'training_area',
  'double-gated': 'double_gated',
  'beach': 'water_access',
  'lake': 'water_access',
  'river': 'water_access',
  'stream': 'water_access',
};

function detectAmenities(summary) {
  if (!summary) return [];
  const amenities = [];
  const text = summary.toLowerCase();
  
  for (const [keyword, amenity] of Object.entries(AMENITY_KEYWORDS)) {
    if (text.includes(keyword.toLowerCase()) && !amenities.includes(amenity)) {
      amenities.push(amenity);
    }
  }
  
  return amenities.sort();
}

function detectFenced(summary) {
  if (!summary) return false;
  const text = summary.toLowerCase();
  return text.includes('fenced') || 
         text.includes('fenced-in') || 
         text.includes('fully fenced') ||
         text.includes('enclosed');
}

function detectWater(summary) {
  if (!summary) return false;
  const text = summary.toLowerCase();
  
  // Explicit "no water" mentions
  if (text.includes('no water') || 
      text.includes('no running water') ||
      text.includes('pack some for your pup') ||
      text.includes('no water source')) {
    return false;
  }
  
  return text.includes('water') || 
         text.includes('drinking fountain') ||
         text.includes('water station') ||
         text.includes('water source') ||
         text.includes('water for') ||
         text.includes('dip his paws') ||
         text.includes('beach') ||
         text.includes('lake') ||
         text.includes('river');
}

function detectShade(summary) {
  if (!summary) return false;
  const text = summary.toLowerCase();
  return text.includes('shade') || 
         text.includes('trees') || 
         text.includes('tree') ||
         text.includes('wooded');
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

/**
 * Normalize a park from JSON-LD style (street, city, state, zip, description)
 * to the format used by generateSql (address, summary).
 */
function normalizePark(park) {
  if (park.summary != null && park.address != null) return park;
  const parts = [park.street, park.city, park.state, park.zip].filter(Boolean);
  return {
    name: park.name,
    summary: park.summary ?? park.description ?? '',
    address: park.address ?? parts.join(', '),
    latitude: park.latitude,
    longitude: park.longitude,
    city: park.city ?? park.city?.name,
  };
}

function generateSql(parks) {
  const lines = [
    `-- ============================================================`,
    `-- Seed Wisconsin Dog Parks from BringFido`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total parks: ${parks.length}`,
    `-- Source: https://www.bringfido.com/attraction/`,
    `-- ============================================================`,
    ``,
    `-- Clear existing WI parks first (optional - comment out if you want to keep existing)`,
    `-- DELETE FROM parks WHERE address LIKE '%, WI %';`,
    ``,
    `INSERT INTO parks (name, description, latitude, longitude, address, amenities, is_fenced, has_water, has_shade)`,
    `VALUES`
  ];
  
  const values = parks.map((park, index) => {
    const summary = park.summary || '';
    const amenities = detectAmenities(summary);
    const isFenced = detectFenced(summary);
    const hasWater = detectWater(summary);
    const hasShade = detectShade(summary);
    
    const name = escapeSql(park.name);
    const description = escapeSql(summary);
    const address = escapeSql(park.address);
    const amenitiesArray = amenities.length > 0 ? amenities.map(a => `'${a}'`).join(', ') : '';
    
    const isLast = index === parks.length - 1;
    
    return `  ('${name}', '${description}', ${park.latitude}, ${park.longitude}, '${address}', ARRAY[${amenitiesArray}]::text[], ${isFenced}, ${hasWater}, ${hasShade})${isLast ? ';' : ','}`;
  });
  
  lines.push(...values);
  lines.push('');
  
  return lines.join('\n');
}

function main() {
  console.log('=== Processing BringFido Data ===\n');
  
  // Check if input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Input file not found: ${INPUT_FILE}`);
    console.log('\nUsage: node scripts/process-bringfido-data.js [input.json] [output.sql]');
    console.log('  Default input: scripts/data/bringfido-parks.json');
    console.log('  Default output: supabase/migrations/00004_seed_wi_parks.sql');
    console.log('  Example: node scripts/process-bringfido-data.js scripts/data/illinois-parks.json supabase/migrations/00008_seed_il_parks.sql');
    console.log('\nJSON: array of parks, or { "results": [...] }. Each park: name, summary/description, address or (street, city, state, zip), latitude, longitude.');
    process.exit(1);
  }
  
  // Read and parse the JSON
  let data;
  try {
    const content = fs.readFileSync(INPUT_FILE, 'utf8');
    data = JSON.parse(content);
  } catch (err) {
    console.error('Error parsing JSON:', err.message);
    process.exit(1);
  }
  
  // Extract parks array (handle both {results: []} and direct array formats)
  let parks = [];
  if (Array.isArray(data)) {
    parks = data;
  } else if (data.results && Array.isArray(data.results)) {
    parks = data.results;
  } else {
    console.error('Error: JSON must be an array or have a "results" property containing an array');
    process.exit(1);
  }

  parks = parks.map(normalizePark);

  console.log(`Processing ${parks.length} parks...\n`);
  
  // Show detection stats
  let fencedCount = 0;
  let waterCount = 0;
  let shadeCount = 0;
  
  parks.forEach(park => {
    const summary = park.summary || '';
    if (detectFenced(summary)) fencedCount++;
    if (detectWater(summary)) waterCount++;
    if (detectShade(summary)) shadeCount++;
  });
  
  console.log('Detected features:');
  console.log(`  - Fenced: ${fencedCount} parks`);
  console.log(`  - Water: ${waterCount} parks`);
  console.log(`  - Shade: ${shadeCount} parks`);
  console.log('');
  
  // Generate and save SQL
  const sql = generateSql(parks);
  fs.writeFileSync(OUTPUT_FILE, sql, 'utf8');
  
  console.log(`SQL file written to: ${OUTPUT_FILE}`);
  console.log('\nPreview of first 5 parks:');
  parks.slice(0, 5).forEach((park, i) => {
    const summary = park.summary || '';
    console.log(`  ${i + 1}. ${park.name} (${park.city || park.city?.name || 'Unknown'}, WI)`);
    console.log(`     Address: ${park.address}`);
    console.log(`     Features: Fenced=${detectFenced(summary)}, Water=${detectWater(summary)}, Shade=${detectShade(summary)}`);
    console.log(`     Amenities: [${detectAmenities(summary).join(', ')}]`);
    console.log('');
  });
  
  if (parks.length > 5) {
    console.log(`... and ${parks.length - 5} more parks`);
  }
}

main();

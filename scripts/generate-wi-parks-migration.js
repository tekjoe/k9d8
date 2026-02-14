#!/usr/bin/env node
/**
 * Generate a SQL migration to seed Wisconsin dog parks from scraped BringFido data.
 * Reads from scripts/data/wisconsin-parks.json and outputs a SQL migration file.
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'data/wisconsin-parks.json');
const OUTPUT_FILE = path.join(__dirname, '../supabase/migrations/00006_seed_all_wi_parks.sql');

// Keywords to detect amenities from descriptions
const AMENITY_KEYWORDS = {
  'waste stations': 'waste_bags',
  'waste station': 'waste_bags',
  'waste bag': 'waste_bags',
  'mutt mitt': 'waste_bags',
  'bag dispenser': 'waste_bags',
  'picnic table': 'picnic_tables',
  'bench': 'benches',
  'shade': 'shade_trees',
  'trees': 'shade_trees',
  'wooded': 'shade_trees',
  'water': 'water_access',
  'drinking fountain': 'water_access',
  'agility': 'agility_equipment',
  'fenced': 'fenced',
  'enclosed': 'fenced',
  'trails': 'walking_trails',
  'walking path': 'walking_trails',
  'path': 'walking_trails',
  'parking': 'parking',
  'porta-potty': 'restroom',
  'restroom': 'restroom',
  'light': 'lighting',
  'separate section': 'separate_areas',
  'separate area': 'separate_areas',
  'small dogs': 'separate_areas',
  'large dogs': 'separate_areas',
  'small and large': 'separate_areas',
};

function detectAmenities(description) {
  const amenities = new Set();
  const text = (description || '').toLowerCase();

  for (const [keyword, amenity] of Object.entries(AMENITY_KEYWORDS)) {
    if (text.includes(keyword.toLowerCase())) {
      amenities.add(amenity);
    }
  }

  return [...amenities].sort();
}

function detectFenced(description) {
  const text = (description || '').toLowerCase();
  // Check for "not fenced" or "not fully fenced" patterns
  if (text.includes('not fenced') || text.includes('not fully fenced') || text.includes('not entirely fenced') || text.includes('non-fenced')) {
    return false;
  }
  return text.includes('fenced') || text.includes('enclosed');
}

function detectWater(description) {
  const text = (description || '').toLowerCase();
  // Check for "no water" patterns
  if (text.includes('no water') || text.includes('bring water') || text.includes('bring your own water') || text.includes('pack water') || text.includes('pack some for')) {
    return false;
  }
  return text.includes('water') ||
    text.includes('drinking fountain') ||
    text.includes('water station') ||
    text.includes('water source') ||
    text.includes('dip his paws') ||
    text.includes('creek') ||
    text.includes('pond') ||
    text.includes('swimming') ||
    text.includes('river access');
}

function detectShade(description) {
  const text = (description || '').toLowerCase();
  return text.includes('shade') ||
    text.includes('shady') ||
    text.includes('shaded') ||
    text.includes('trees') ||
    text.includes('wooded') ||
    text.includes('tree');
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function buildAddress(park) {
  const parts = [];
  if (park.street) parts.push(park.street);
  if (park.city) parts.push(park.city);
  if (park.state && park.zip) {
    parts.push(`${park.state} ${park.zip}`);
  } else if (park.state) {
    parts.push(park.state);
  }
  return parts.join(', ');
}

function main() {
  console.log('Reading park data...');
  const parks = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log(`Loaded ${parks.length} parks`);

  const lines = [
    `-- ============================================================`,
    `-- Seed ALL Wisconsin Dog Parks from BringFido`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total parks: ${parks.length}`,
    `-- Source: https://www.bringfido.com/attraction/parks/state/wisconsin/`,
    `-- ============================================================`,
    ``,
    `-- Clear existing parks and re-seed with full dataset`,
    `DELETE FROM parks;`,
    ``,
    `INSERT INTO parks (name, description, latitude, longitude, address, amenities, is_fenced, has_water, has_shade)`,
    `VALUES`
  ];

  const values = parks.map((park, index) => {
    const description = park.description || '';
    const amenities = detectAmenities(description);
    const isFenced = detectFenced(description);
    const hasWater = detectWater(description);
    const hasShade = detectShade(description);
    const address = buildAddress(park);

    const amenitiesArray = amenities.map(a => `'${a}'`).join(', ');
    const isLast = index === parks.length - 1;

    return `  ('${escapeSql(park.name)}', '${escapeSql(description)}', ${park.latitude}, ${park.longitude}, '${escapeSql(address)}', ARRAY[${amenitiesArray}]::text[], ${isFenced}, ${hasWater}, ${hasShade})${isLast ? ';' : ','}`;
  });

  lines.push(...values);
  lines.push('');

  const sql = lines.join('\n');
  fs.writeFileSync(OUTPUT_FILE, sql, 'utf8');

  console.log(`\nSQL migration written to: ${OUTPUT_FILE}`);
  console.log(`\nSummary:`);
  console.log(`  Total parks: ${parks.length}`);
  console.log(`  Fenced: ${parks.filter(p => detectFenced(p.description)).length}`);
  console.log(`  Has water: ${parks.filter(p => detectWater(p.description)).length}`);
  console.log(`  Has shade: ${parks.filter(p => detectShade(p.description)).length}`);
}

main();

#!/usr/bin/env node
/**
 * Generate a single combined SQL migration for ALL 50 states.
 * Reads from scripts/data/<state>-parks.json files.
 * Includes city and state columns.
 */

const fs = require('fs');
const path = require('path');
const { US_STATES } = require('./us-states');

const DATA_DIR = path.join(__dirname, 'data');

const AMENITY_KEYWORDS = {
  'waste stations': 'waste_bags', 'waste station': 'waste_bags',
  'waste bag': 'waste_bags', 'mutt mitt': 'waste_bags', 'poop disposal': 'waste_bags',
  'picnic table': 'picnic_tables', 'bench': 'benches',
  'shade tree': 'shade_trees', 'trees': 'shade_trees', 'wooded': 'shade_trees', 'tree': 'shade_trees',
  'water': 'water_access', 'drinking fountain': 'water_access',
  'water station': 'water_access', 'water source': 'water_access', 'dip his paws': 'water_access',
  'agility': 'agility_equipment', 'fenced': 'fenced', 'fenced-in': 'fenced',
  'trails': 'walking_trails', 'path': 'walking_trails', 'pathway': 'walking_trails',
  'parking': 'parking', 'porta-potty': 'restroom', 'restroom': 'restroom', 'bathroom': 'restroom',
  'light': 'lighting', 'solar light': 'lighting',
  'separate section': 'separate_areas', 'separate area': 'separate_areas',
  'small dogs': 'separate_areas', 'large dogs': 'separate_areas',
  'training area': 'training_area', 'double-gated': 'double_gated',
  'beach': 'water_access', 'lake': 'water_access', 'river': 'water_access', 'stream': 'water_access',
};

function detectAmenities(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const amenities = [];
  for (const [kw, amenity] of Object.entries(AMENITY_KEYWORDS)) {
    if (lower.includes(kw) && !amenities.includes(amenity)) amenities.push(amenity);
  }
  return amenities.sort();
}

function detectFenced(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return lower.includes('fenced') || lower.includes('fenced-in') || lower.includes('fully fenced') || lower.includes('enclosed');
}

function detectWater(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (lower.includes('no water') || lower.includes('no running water') || lower.includes('no water source')) return false;
  return lower.includes('water') || lower.includes('drinking fountain') || lower.includes('water station') ||
    lower.includes('water source') || lower.includes('dip his paws') ||
    lower.includes('beach') || lower.includes('lake') || lower.includes('river');
}

function detectShade(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return lower.includes('shade') || lower.includes('trees') || lower.includes('tree') || lower.includes('wooded');
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

function buildAddress(park) {
  const parts = [park.street, park.city, park.state, park.zip].filter(Boolean);
  return parts.join(', ');
}

function main() {
  const allParks = [];
  const stateCounts = {};

  for (const state of US_STATES) {
    const filePath = path.join(DATA_DIR, `${state.slug}-parks.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  No data: ${state.name}`);
      continue;
    }

    const parks = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    stateCounts[state.abbreviation] = parks.length;

    parks.forEach(park => {
      const desc = park.summary || park.description || '';
      const address = park.address || buildAddress(park);
      const city = park.city || '';

      allParks.push({
        name: park.name,
        description: desc,
        latitude: park.latitude,
        longitude: park.longitude,
        address,
        city,
        state: park.state || state.abbreviation,
        amenities: detectAmenities(desc),
        is_fenced: detectFenced(desc),
        has_water: detectWater(desc),
        has_shade: detectShade(desc),
      });
    });

    console.log(`  ✅ ${state.name}: ${parks.length} parks`);
  }

  console.log(`\n📊 Total: ${allParks.length} parks from ${Object.keys(stateCounts).length} states\n`);

  // Generate SQL
  const lines = [
    `-- ============================================================`,
    `-- Seed ALL US Dog Parks (50 states)`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total parks: ${allParks.length}`,
    `-- ============================================================`,
    ``,
    `-- Remove all existing seeded parks and re-insert with clean data`,
    `DELETE FROM parks WHERE id NOT IN (SELECT DISTINCT park_id FROM check_ins WHERE park_id IS NOT NULL);`,
    ``,
    `INSERT INTO parks (name, description, latitude, longitude, address, city, state, amenities, is_fenced, has_water, has_shade)`,
    `VALUES`,
  ];

  const values = allParks.map((park, i) => {
    const name = escapeSql(park.name);
    const desc = escapeSql(park.description);
    const address = escapeSql(park.address);
    const city = escapeSql(park.city);
    const state = escapeSql(park.state);
    const amenitiesArr = park.amenities.length > 0 ? park.amenities.map(a => `'${a}'`).join(', ') : '';
    const isLast = i === allParks.length - 1;

    return `  ('${name}', '${desc}', ${park.latitude}, ${park.longitude}, '${address}', '${city}', '${state}', ARRAY[${amenitiesArr}]::text[], ${park.is_fenced}, ${park.has_water}, ${park.has_shade})${isLast ? ';' : ','}`;
  });

  lines.push(...values);
  lines.push('');

  const outputFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260221100000_seed_all_us_parks.sql');
  fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');

  console.log(`✅ Migration written to: ${path.basename(outputFile)}`);
  console.log(`   ${allParks.length} parks from ${Object.keys(stateCounts).length} states`);
}

main();

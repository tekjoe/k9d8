#!/usr/bin/env node
/**
 * Fetch Wisconsin dog parks from BringFido API
 * and generate SQL to populate the database
 */

const fs = require('fs');
const path = require('path');

const STATE = 'wisconsin';
const API_BASE = 'https://www.bringfido.com/attraction/';
const OUTPUT_FILE = path.join(__dirname, '../supabase/migrations/00004_seed_wi_parks.sql');

// Keywords to detect amenities from descriptions
const AMENITY_KEYWORDS = {
  'waste stations': 'waste_bags',
  'waste bag': 'waste_bags',
  'mutt mitt': 'waste_bags',
  'picnic table': 'picnic_tables',
  'bench': 'benches',
  'shade': 'shade_trees',
  'trees': 'shade_trees',
  'water': 'water_access',
  'agility': 'agility_equipment',
  'fenced': 'fenced',
  'trails': 'walking_trails',
  'path': 'walking_trails',
  'parking': 'parking',
  'porta-potty': 'restroom',
  'restroom': 'restroom',
  'light': 'lighting',
  'separate section': 'separate_areas',
  'small dogs': 'separate_areas',
  'large dogs': 'separate_areas',
};

/**
 * Detect amenities from the park description/summary
 */
function detectAmenities(summary) {
  const amenities = [];
  const text = summary.toLowerCase();
  
  for (const [keyword, amenity] of Object.entries(AMENITY_KEYWORDS)) {
    if (text.includes(keyword.toLowerCase()) && !amenities.includes(amenity)) {
      amenities.push(amenity);
    }
  }
  
  return amenities;
}

/**
 * Check if description indicates the park is fenced
 */
function detectFenced(summary) {
  const text = summary.toLowerCase();
  return text.includes('fenced') || 
         text.includes('fenced-in') || 
         text.includes('fully fenced') ||
         text.includes('enclosed');
}

/**
 * Check if description indicates water availability
 */
function detectWater(summary) {
  const text = summary.toLowerCase();
  return text.includes('water') || 
         text.includes('drinking fountain') ||
         text.includes('water station') ||
         text.includes('water source') ||
         text.includes('water for') ||
         text.includes('dip his paws');
}

/**
 * Check if description indicates shade availability
 */
function detectShade(summary) {
  const text = summary.toLowerCase();
  return text.includes('shade') || 
         text.includes('trees') || 
         text.includes('wooded') ||
         text.includes('tree');
}

/**
 * Escape SQL string literals
 */
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

/**
 * Fetch a single page of results
 */
async function fetchPage(start) {
  const url = `${API_BASE}?state=${STATE}&type=P&start=${start}&refresh=0&__amp_source_origin=${encodeURIComponent(API_BASE)}`;
  
  console.log(`Fetching parks ${start} to ${start + 20}...`);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Referer': 'https://www.bringfido.com/attraction/',
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Fetch all parks for Wisconsin
 */
async function fetchAllParks() {
  const allParks = [];
  let start = 0;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const data = await fetchPage(start);
      
      if (data.status !== 'success' || !data.results || data.results.length === 0) {
        hasMore = false;
        break;
      }
      
      allParks.push(...data.results);
      console.log(`  -> Got ${data.results.length} parks (total: ${allParks.length})`);
      
      // Check if there are more results
      if (!data.nextResultOffset || data.results.length < 20) {
        hasMore = false;
      } else {
        start = data.nextResultOffset;
      }
      
      // Be nice to the server
      await new Promise(r => setTimeout(r, 500));
      
    } catch (error) {
      console.error(`Error fetching page starting at ${start}:`, error.message);
      hasMore = false;
    }
  }
  
  return allParks;
}

/**
 * Generate SQL insert statements
 */
function generateSql(parks) {
  const lines = [
    `-- ============================================================`,
    `-- Seed Wisconsin Dog Parks from BringFido`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total parks: ${parks.length}`,
    `-- ============================================================`,
    ``,
    `-- Clear existing parks first (optional - comment out if you want to keep existing)`,
    `-- TRUNCATE TABLE parks CASCADE;`,
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
    const amenitiesArray = amenities.map(a => `'${a}'`).join(', ');
    
    const isLast = index === parks.length - 1;
    
    return `  ('${name}', '${description}', ${park.latitude}, ${park.longitude}, '${address}', ARRAY[${amenitiesArray}]::text[], ${isFenced}, ${hasWater}, ${hasShade})${isLast ? ';' : ','}`;
  });
  
  lines.push(...values);
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
  console.log('=== Fetching Wisconsin Dog Parks from BringFido ===\n');
  
  const parks = await fetchAllParks();
  
  if (parks.length === 0) {
    console.error('No parks fetched!');
    process.exit(1);
  }
  
  console.log(`\n=== Fetched ${parks.length} parks ===\n`);
  
  const sql = generateSql(parks);
  
  fs.writeFileSync(OUTPUT_FILE, sql, 'utf8');
  
  console.log(`SQL file written to: ${OUTPUT_FILE}`);
  console.log('\nPreview of first 3 parks:');
  parks.slice(0, 3).forEach((park, i) => {
    console.log(`  ${i + 1}. ${park.name} (${park.city?.name}, WI)`);
    console.log(`     Address: ${park.address}`);
    console.log(`     Fenced: ${detectFenced(park.summary)}, Water: ${detectWater(park.summary)}, Shade: ${detectShade(park.summary)}`);
    console.log('');
  });
}

main().catch(console.error);

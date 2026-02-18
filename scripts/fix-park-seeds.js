#!/usr/bin/env node
/**
 * Fix park seed files to include city and state columns and values
 * 
 * Usage:
 *   node scripts/fix-park-seeds.js
 */

const fs = require('fs');
const path = require('path');

const { US_STATES } = require('./us-states');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

/**
 * Extract city and state from address string
 * Address format variations:
 *   - "Street, City, ST ZIP"  
 *   - "Street, City, ST, ZIP" (Wisconsin format with comma after state)
 *   - "StreetCity, City, ST ZIP" (merged)
 *   - "City, ST" (minimal)
 */
function extractCityState(address) {
  if (!address) return { city: null, state: null };
  
  // Clean up the address
  const cleanAddress = address.trim();
  
  // Try to find state abbreviation (2 uppercase letters before ZIP or end)
  // Match pattern: comma/space + 2 letters + optional comma + optional space + ZIP
  // Handles both: "City, ST ZIP" and "City, ST, ZIP"
  const stateZipMatch = cleanAddress.match(/,\s*([A-Z]{2})(?:,)?(?:\s+\d{5}(?:-\d{4})?)?$/);
  
  if (!stateZipMatch) {
    return { city: null, state: null };
  }
  
  const state = stateZipMatch[1];
  const addressBeforeState = cleanAddress.substring(0, stateZipMatch.index);
  
  // Find city (last part before state, separated by comma)
  const cityMatch = addressBeforeState.match(/,\s*([^,]+)$/);
  let city = cityMatch ? cityMatch[1].trim() : null;
  
  return { city, state };
}

/**
 * Fix a single seed file
 */
function fixSeedFile(filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠️  File not found: ${filepath}`);
    return;
  }
  
  console.log(`  🔧 Processing ${filename}...`);
  
  let content = fs.readFileSync(filepath, 'utf8');
  let modified = false;
  
  // Check if file has city/state columns - add them if not
  let hasCityStateColumns = content.includes('INSERT INTO parks (name, description, latitude, longitude, address, city, state,');
  
  if (!hasCityStateColumns) {
    // Replace the INSERT statement to include city and state
    content = content.replace(
      /INSERT INTO parks \(name, description, latitude, longitude, address, amenities, is_fenced, has_water, has_shade\)/g,
      'INSERT INTO parks (name, description, latitude, longitude, address, city, state, amenities, is_fenced, has_water, has_shade)'
    );
    console.log(`    Added city/state columns to INSERT`);
    modified = true;
  }
  
  // Fix #1: Rows without city/state columns at all
  // Pattern: (..., 'address', ARRAY[...], bool, bool, bool)
  let matchCount1 = 0;
  const rowRegex1 = /\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*'((?:[^']|'')*)'\s*,\s*(ARRAY\[(?:[^\]]*)\](?:::\w+\[\])?)\s*,\s*(true|false)\s*,\s*(true|false)\s*,\s*(true|false)\s*\)/g;
  
  content = content.replace(rowRegex1, (match, name, description, lat, lng, address, amenities, isFenced, hasWater, hasShade) => {
    const { city, state } = extractCityState(address);
    matchCount1++;
    modified = true;
    return `('${name}', '${description}', ${lat}, ${lng}, '${address}', ${city ? `'${city}'` : 'NULL'}, ${state ? `'${state}'` : 'NULL'}, ${amenities}, ${isFenced}, ${hasWater}, ${hasShade})`;
  });
  
  if (matchCount1 > 0) {
    console.log(`    Fixed ${matchCount1} rows (added city/state)`);
  }
  
  // Fix #2: Rows that already have city/state columns but with NULL values
  // Pattern: (..., 'address', NULL, NULL, ARRAY[...], bool, bool, bool)
  let matchCount2 = 0;
  const rowRegex2 = /\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*'((?:[^']|'')*)'\s*,\s*NULL\s*,\s*NULL\s*,\s*(ARRAY\[(?:[^\]]*)\](?:::\w+\[\])?)\s*,\s*(true|false)\s*,\s*(true|false)\s*,\s*(true|false)\s*\)/g;
  
  content = content.replace(rowRegex2, (match, name, description, lat, lng, address, amenities, isFenced, hasWater, hasShade) => {
    const { city, state } = extractCityState(address);
    matchCount2++;
    modified = true;
    return `('${name}', '${description}', ${lat}, ${lng}, '${address}', ${city ? `'${city}'` : 'NULL'}, ${state ? `'${state}'` : 'NULL'}, ${amenities}, ${isFenced}, ${hasWater}, ${hasShade})`;
  });
  
  if (matchCount2 > 0) {
    console.log(`    Fixed ${matchCount2} rows (replaced NULL city/state)`);
  }
  
  if (modified) {
    // Write the fixed content back
    fs.writeFileSync(filepath, content);
    console.log(`  ✅ Saved changes to ${filename}`);
  } else if (matchCount1 === 0 && matchCount2 === 0) {
    console.log(`  ⚠️  No rows matched in ${filename} - may already be fixed or different format`);
  }
}

/**
 * Fix all seed files for states
 */
function fixAllSeedFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.match(/seed.*parks\.sql$/))
    .sort();
  
  console.log(`\n🔧 Fixing ${files.length} seed files...\n`);
  
  let fixed = 0;
  for (const file of files) {
    try {
      fixSeedFile(file);
      fixed++;
    } catch (error) {
      console.error(`  ❌ Error fixing ${file}: ${error.message}`);
      console.error(error.stack);
    }
  }
  
  console.log(`\n✅ Processed ${fixed} files`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const singleFile = args.find(a => !a.startsWith('--'));
  
  if (singleFile) {
    // Fix single file
    console.log(`\n🔧 Fixing single file: ${singleFile}\n`);
    fixSeedFile(singleFile);
  } else {
    // Fix all files
    fixAllSeedFiles();
  }
  
  console.log('\n🎉 Done!');
}

main();

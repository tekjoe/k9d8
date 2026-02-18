#!/usr/bin/env node
/**
 * Batch process all scraped state data and generate SQL migrations
 * 
 * Usage:
 *   node scripts/batch-process-states.js
 *   node scripts/batch-process-states.js --state=california
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { PENDING_STATES, COMPLETED_STATES, US_STATES } = require('./us-states');

const DATA_DIR = path.join(__dirname, 'data');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

/**
 * Process a single state's data file
 */
function processState(stateSlug, stateAbbreviation) {
  const inputFile = path.join(DATA_DIR, `${stateSlug}-parks.json`);
  
  if (!fs.existsSync(inputFile)) {
    console.log(`  ⚠️  Data file not found: ${inputFile}`);
    return null;
  }
  
  console.log(`  📊 Processing ${stateSlug}...`);
  
  // Generate migration number (sequential based on existing)
  const existingMigrations = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  const lastMigration = existingMigrations[existingMigrations.length - 1];
  const lastNumber = parseInt(lastMigration.match(/(\d+)/)?.[0] || '0');
  const migrationNumber = String(lastNumber + 1).padStart(5, '0');
  
  const outputFile = path.join(MIGRATIONS_DIR, `${migrationNumber}_seed_${stateSlug}_parks.sql`);
  
  try {
    // Run the process-bringfido-data.js script
    execSync(
      `node "${path.join(__dirname, 'process-bringfido-data.js')}" "${inputFile}" "${outputFile}"`,
      { stdio: 'inherit' }
    );
    
    console.log(`  ✅ Generated: ${path.basename(outputFile)}`);
    return outputFile;
  } catch (error) {
    console.error(`  ❌ Failed to process ${stateSlug}: ${error.message}`);
    return null;
  }
}

/**
 * Generate a combined migration for all states
 */
function generateCombinedMigration() {
  console.log('\n📦 Generating combined migration...');
  
  const allParks = [];
  let totalStates = 0;
  
  // Collect all parks from data files
  for (const state of US_STATES) {
    const inputFile = path.join(DATA_DIR, `${state.slug}-parks.json`);
    
    if (fs.existsSync(inputFile)) {
      try {
        const parks = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        allParks.push(...parks);
        totalStates++;
        console.log(`  📥 ${state.name}: ${parks.length} parks`);
      } catch (error) {
        console.error(`  ❌ Error reading ${state.slug}: ${error.message}`);
      }
    }
  }
  
  // Create combined parks file
  const combinedFile = path.join(DATA_DIR, 'all-us-parks.json');
  fs.writeFileSync(combinedFile, JSON.stringify(allParks, null, 2));
  
  console.log(`\n  📊 Total: ${allParks.length} parks from ${totalStates} states`);
  
  // Generate combined SQL
  const existingMigrations = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  const lastMigration = existingMigrations[existingMigrations.length - 1];
  const lastNumber = parseInt(lastMigration.match(/(\d+)/)?.[0] || '0');
  const migrationNumber = String(lastNumber + 1).padStart(5, '0');
  
  const outputFile = path.join(MIGRATIONS_DIR, `${migrationNumber}_seed_all_us_parks.sql`);
  
  try {
    execSync(
      `node "${path.join(__dirname, 'process-bringfido-data.js')}" "${combinedFile}" "${outputFile}"`,
      { stdio: 'inherit' }
    );
    
    console.log(`\n  ✅ Combined migration: ${path.basename(outputFile)}`);
    return outputFile;
  } catch (error) {
    console.error(`\n  ❌ Failed to generate combined migration: ${error.message}`);
    return null;
  }
}

/**
 * Show summary of data collection progress
 */
function showSummary() {
  console.log('\n📊 Data Collection Summary\n');
  
  const results = US_STATES.map(state => {
    const filePath = path.join(DATA_DIR, `${state.slug}-parks.json`);
    const exists = fs.existsSync(filePath);
    const count = exists ? JSON.parse(fs.readFileSync(filePath, 'utf8')).length : 0;
    return { ...state, exists, count };
  });
  
  const completed = results.filter(r => r.count > 0);
  const pending = results.filter(r => r.count === 0);
  const totalParks = results.reduce((sum, r) => sum + r.count, 0);
  
  console.log(`Completed (${completed.length}/${US_STATES.length} states):`);
  completed.forEach(r => {
    const status = r.completed ? '✅' : '📄';
    console.log(`  ${status} ${r.name}: ${r.count} parks`);
  });
  
  if (pending.length > 0) {
    console.log(`\nPending (${pending.length} states):`);
    pending.forEach(r => {
      console.log(`  ⏳ ${r.name}`);
    });
  }
  
  console.log(`\n🎯 Total parks collected: ${totalParks}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const stateArg = args.find(a => a.startsWith('--state='));
  const singleState = stateArg ? stateArg.split('=')[1] : null;
  const combined = args.includes('--combined');
  const summary = args.includes('--summary');
  
  if (summary) {
    showSummary();
    return;
  }
  
  if (combined) {
    generateCombinedMigration();
    return;
  }
  
  if (singleState) {
    // Process single state
    const state = US_STATES.find(s => s.slug === singleState);
    if (!state) {
      console.error(`State "${singleState}" not found.`);
      process.exit(1);
    }
    
    console.log(`\n🔄 Processing single state: ${state.name}\n`);
    processState(state.slug, state.abbreviation);
    
  } else {
    // Process all states with data files
    console.log('\n🔄 Batch processing all states with data files\n');
    
    let processed = 0;
    for (const state of PENDING_STATES) {
      const result = processState(state.slug, state.abbreviation);
      if (result) processed++;
    }
    
    console.log(`\n✅ Processed ${processed} states`);
  }
  
  // Show summary at the end
  showSummary();
}

main();

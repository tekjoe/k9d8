#!/usr/bin/env node
/**
 * Validate scraped park data for completeness
 * Ensures all required fields are present
 * 
 * Usage:
 *   node scripts/validate-park-data.js <state-slug>
 *   node scripts/validate-park-data.js tennessee
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

function validateParks(parks, stateName) {
  const issues = [];
  const stats = {
    total: parks.length,
    withDescription: 0,
    withCoordinates: 0,
    withAddress: 0,
    withZip: 0,
  };

  parks.forEach((park, index) => {
    const parkRef = `${park.name || `#${index + 1}`}`;
    
    // Check name
    if (!park.name || park.name.trim().length === 0) {
      issues.push({ park: parkRef, field: 'name', issue: 'Missing name' });
    }
    
    // Check description
    if (!park.description || park.description.trim().length === 0) {
      issues.push({ park: parkRef, field: 'description', issue: 'Missing description' });
    } else {
      stats.withDescription++;
    }
    
    // Check coordinates
    const hasLat = park.latitude !== null && park.latitude !== undefined && !isNaN(park.latitude);
    const hasLng = park.longitude !== null && park.longitude !== undefined && !isNaN(park.longitude);
    
    if (!hasLat || !hasLng) {
      issues.push({ 
        park: parkRef, 
        field: 'coordinates', 
        issue: `Missing coordinates (lat: ${park.latitude}, lng: ${park.longitude})` 
      });
    } else {
      // Validate coordinate ranges
      if (park.latitude < -90 || park.latitude > 90) {
        issues.push({ park: parkRef, field: 'latitude', issue: `Invalid latitude: ${park.latitude}` });
      }
      if (park.longitude < -180 || park.longitude > 180) {
        issues.push({ park: parkRef, field: 'longitude', issue: `Invalid longitude: ${park.longitude}` });
      }
      if (park.latitude >= -90 && park.latitude <= 90 && park.longitude >= -180 && park.longitude <= 180) {
        stats.withCoordinates++;
      }
    }
    
    // Check address
    if (!park.street || park.street.trim().length === 0) {
      issues.push({ park: parkRef, field: 'street', issue: 'Missing street address' });
    } else {
      stats.withAddress++;
    }
    
    if (!park.city || park.city.trim().length === 0) {
      issues.push({ park: parkRef, field: 'city', issue: 'Missing city' });
    }
    
    if (!park.zip || park.zip.trim().length === 0) {
      issues.push({ park: parkRef, field: 'zip', issue: 'Missing ZIP code' });
    } else {
      stats.withZip++;
    }
  });

  return { issues, stats };
}

function main() {
  const stateSlug = process.argv[2];
  
  if (!stateSlug) {
    console.log('Usage: node validate-park-data.js <state-slug>');
    console.log('\nAvailable files:');
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('-parks.json'));
    files.forEach(f => console.log(`  - ${f.replace('-parks.json', '')}`));
    process.exit(1);
  }
  
  const inputFile = path.join(DATA_DIR, `${stateSlug}-parks.json`);
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }
  
  console.log(`\n🔍 Validating: ${stateSlug.toUpperCase()}\n`);
  
  const parks = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const { issues, stats } = validateParks(parks, stateSlug);
  
  // Print stats
  console.log('📊 Data Quality Stats:');
  console.log(`  Total parks: ${stats.total}`);
  console.log(`  With description: ${stats.withDescription}/${stats.total} (${Math.round(stats.withDescription/stats.total*100)}%)`);
  console.log(`  With coordinates: ${stats.withCoordinates}/${stats.total} (${Math.round(stats.withCoordinates/stats.total*100)}%)`);
  console.log(`  With street address: ${stats.withAddress}/${stats.total} (${Math.round(stats.withAddress/stats.total*100)}%)`);
  console.log(`  With ZIP code: ${stats.withZip}/${stats.total} (${Math.round(stats.withZip/stats.total*100)}%)`);
  
  // Critical fields: description and coordinates
  const criticalIssues = issues.filter(i => i.field === 'description' || i.field === 'coordinates');
  const otherIssues = issues.filter(i => i.field !== 'description' && i.field !== 'coordinates');
  
  // Print critical issues
  if (criticalIssues.length > 0) {
    console.log(`\n❌ CRITICAL ISSUES (${criticalIssues.length} parks missing required fields):\n`);
    
    criticalIssues.slice(0, 20).forEach(issue => {
      console.log(`  - ${issue.park}: ${issue.issue}`);
    });
    if (criticalIssues.length > 20) {
      console.log(`  ... and ${criticalIssues.length - 20} more`);
    }
    
    console.log('\n❌ VALIDATION FAILED - All parks MUST have descriptions and coordinates\n');
    process.exit(1);
  }
  
  // Print warnings for non-critical issues
  if (otherIssues.length > 0) {
    console.log(`\n⚠️  WARNINGS (${otherIssues.length} minor issues):\n`);
    
    // Group by field
    const byField = {};
    otherIssues.forEach(issue => {
      if (!byField[issue.field]) byField[issue.field] = [];
      byField[issue.field].push(issue);
    });
    
    Object.entries(byField).forEach(([field, fieldIssues]) => {
      console.log(`  ${field.toUpperCase()} (${fieldIssues.length} parks):`);
      fieldIssues.slice(0, 5).forEach(issue => {
        console.log(`    - ${issue.park}`);
      });
      if (fieldIssues.length > 5) {
        console.log(`    ... and ${fieldIssues.length - 5} more`);
      }
      console.log('');
    });
  }
  
  console.log('✅ VALIDATION PASSED - All parks have required descriptions and coordinates!\n');
  process.exit(0);
}

main();

#!/usr/bin/env node
/**
 * Fix street addresses that have city names concatenated at the end.
 * e.g. "3130 Discovery Bay DrAnchorage" -> "3130 Discovery Bay Dr"
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Process ALL state data files
const states = fs.readdirSync(DATA_DIR)
  .filter(f => f.endsWith('-parks.json'))
  .map(f => f.replace('-parks.json', ''));

let totalFixed = 0;

states.forEach(slug => {
  const filePath = path.join(DATA_DIR, `${slug}-parks.json`);
  if (!fs.existsSync(filePath)) return;

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let fixed = 0;

  data.forEach(park => {
    if (!park.street || !park.street.trim()) return;

    const original = park.street;

    // Strategy: if the city name appears at the end of the street (without a
    // space/comma separator), strip it. We check the actual city field first,
    // then fall back to a regex for the lowercase->uppercase boundary.

    // 1. Direct city suffix match (handles "Ave NWCedar Rapids" where the
    //    boundary is uppercase-to-uppercase)
    if (park.city && park.city.length >= 3) {
      // Check if street ends with the city name (no space before it)
      // but NOT if the entire street IS the city name
      const cityPattern = park.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const directMatch = original.match(new RegExp(`^(.+?)${cityPattern}$`));
      if (directMatch && directMatch[1].trim().length > 0) {
        park.street = directMatch[1].trim();
        fixed++;
        return;
      }
    }

    // 2. Regex: lowercase/digit immediately followed by uppercase city name
    // e.g. "3130 Discovery Bay DrAnchorage" -> "Dr" + "Anchorage"
    const match = original.match(/^(.+[a-z0-9])([A-Z][a-zA-Z\s'.\-]+)$/);
    if (match) {
      const potentialStreet = match[1];
      const potentialCity = match[2].trim();

      // Sanity: suffix should be at least 3 chars
      if (potentialCity.length >= 3) {
        park.street = potentialStreet;
        fixed++;
      }
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`${slug}: fixed ${fixed}/${data.length} parks`);
  totalFixed += fixed;
});

console.log(`\nTotal fixed: ${totalFixed}`);

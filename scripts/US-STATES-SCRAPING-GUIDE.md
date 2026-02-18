# US States Dog Park Data Scraping Guide

This guide explains how to collect dog park data for all remaining US states from BringFido.com.

## Current Status

| Status | States |
|--------|--------|
| ✅ Completed | Illinois (IL), Minnesota (MN), Wisconsin (WI) |
| ⏳ Pending | 47 remaining states |

## Quick Start

### Option 1: Automated Scraping (Recommended)

```bash
# Install Playwright
npm install playwright
npx playwright install chromium

# Scrape a single state
node scripts/scrape-bringfido-state.js california

# Scrape all pending states (takes ~2-3 hours)
node scripts/scrape-bringfido-state.js --all
```

### Option 2: Manual Extraction

If automated scraping is blocked by Cloudflare, use manual extraction:

1. Visit the state's BringFido page (e.g., `https://www.bringfido.com/attraction/parks/state/california/`)
2. Open DevTools → Console
3. Run the extraction script (provided below)
4. Save the JSON output
5. Repeat for all pages

## Detailed Instructions

### Automated Scraping

#### Prerequisites

```bash
npm install playwright
npx playwright install chromium
```

#### Scrape a Single State

```bash
node scripts/scrape-bringfido-state.js <state-slug>

# Examples:
node scripts/scrape-bringfido-state.js california
node scripts/scrape-bringfido-state.js texas
node scripts/scrape-bringfido-state.js florida
```

Data will be saved to `scripts/data/<state-slug>-parks.json`

#### Scrape All Pending States

```bash
node scripts/scrape-bringfido-state.js --all
```

⚠️ **Warning:** This will take 2-3 hours and makes many requests. Run during off-peak hours.

### Manual Extraction (Fallback)

If automated scraping fails due to Cloudflare protection:

#### Step 1: Visit the State Page

Navigate to: `https://www.bringfido.com/attraction/parks/state/<state>/`

Examples:
- California: https://www.bringfido.com/attraction/parks/state/california/
- Texas: https://www.bringfido.com/attraction/parks/state/texas/

#### Step 2: Load All Results

Scroll down and click "See More Results" until all parks are loaded, or navigate through pagination (`?page=2`, `?page=3`, etc.)

#### Step 3: Extract Data with Console Script

Open DevTools (F12) → Console and paste:

```javascript
// Extract all park data from JSON-LD
const parks = [];
document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
  try {
    const data = JSON.parse(script.textContent);
    const items = Array.isArray(data) ? data : [data];
    items.forEach(item => {
      if (item['@type'] && (item['@type'].includes('TouristAttraction') || item['@type'].includes('Place'))) {
        let street = '', city = '', state = '', zip = '';
        if (item.address) {
          if (typeof item.address === 'string') {
            const parts = item.address.split(',').map(p => p.trim());
            if (parts.length >= 3) {
              street = parts[0];
              city = parts[1];
              const stateZip = parts[2].split(' ');
              state = stateZip[0] || '';
              zip = stateZip[1] || '';
            }
          } else if (item.address['@type'] === 'PostalAddress') {
            street = item.address.streetAddress || '';
            city = item.address.addressLocality || '';
            state = item.address.addressRegion || '';
            zip = item.address.postalCode || '';
          }
        }
        
        let latitude = null, longitude = null;
        if (item.geo) {
          latitude = parseFloat(item.geo.latitude) || null;
          longitude = parseFloat(item.geo.longitude) || null;
        }
        
        let bringfidoId = '';
        if (item.url) {
          const match = item.url.match(/attraction\/(\d+)/);
          if (match) bringfidoId = match[1];
        }
        
        if (item.name && state) {
          parks.push({
            name: item.name,
            street,
            city,
            state,
            zip,
            latitude,
            longitude,
            description: item.description || '',
            bringfido_id: bringfidoId,
          });
        }
      }
    });
  } catch (e) {}
});

// Output as JSON
console.log('Found', parks.length, 'parks');
copy(JSON.stringify(parks, null, 2));
console.log('✅ Data copied to clipboard!');
```

#### Step 4: Save the Data

1. The script copies JSON to clipboard automatically
2. Paste into a new file: `scripts/data/<state>-parks.json`
3. Format/validate the JSON

#### Step 5: Repeat for All Pages

If the state has multiple pages, repeat for each:
- Page 1: `/attraction/parks/state/california/`
- Page 2: `/attraction/parks/state/california/?page=2`
- Page 3: `/attraction/parks/state/california/?page=3`

Merge the arrays from all pages into one file.

## Processing the Data

### Generate SQL Migrations

Once you have the JSON data files:

```bash
# Process all states with data files
node scripts/batch-process-states.js

# Process a single state
node scripts/batch-process-states.js --state=california

# Generate a combined migration (all states in one file)
node scripts/batch-process-states.js --combined
```

### Check Collection Progress

```bash
node scripts/batch-process-states.js --summary
```

Output example:
```
📊 Data Collection Summary

Completed (5/50 states):
  ✅ Illinois: 183 parks
  ✅ Minnesota: 131 parks
  ✅ Wisconsin: 138 parks
  📄 California: 245 parks
  📄 Texas: 189 parks

Pending (45 states):
  ⏳ Alabama
  ⏳ Alaska
  ...

🎯 Total parks collected: 886
📁 Data directory: /Users/tekjoe/Dev/k9d8/scripts/data
```

## State Priority List

Focus on states with highest dog ownership populations first:

### High Priority (Large populations)
1. California (~40M people)
2. Texas (~29M)
3. Florida (~22M)
4. New York (~19M)
5. Pennsylvania (~13M)
6. Ohio (~12M)
7. Georgia (~11M)
8. North Carolina (~10M)
9. Michigan (~10M)
10. New Jersey (~9M)

### Medium Priority
11. Virginia, Washington, Arizona, Massachusetts, Tennessee
16. Indiana, Missouri, Maryland, Wisconsin ✅, Colorado

### Lower Priority (Smaller states)
Remaining states including Alaska, Hawaii, Montana, Wyoming, etc.

## Data Validation

Before processing, validate the scraped data:

```bash
# Validate a state's data
node scripts/validate-state-data.js california
```

Check for:
- ✅ All parks have name, city, state
- ✅ Coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
- ✅ No duplicate bringfido_ids
- ✅ State abbreviation matches file name

## Troubleshooting

### Cloudflare Blocks

**Symptom:** "Access Denied" or CAPTCHA page

**Solutions:**
1. Try manual extraction method
2. Add delays between requests (already in script)
3. Use a VPN or different IP
4. Scrape during off-peak hours (early morning)

### Missing Data

**Symptom:** Empty or partial data

**Solutions:**
1. Check if page has JSON-LD: DevTools → Elements → Search for `ld+json`
2. Try scrolling to load all results first
3. Check if BringFido changed their page structure

### Duplicate Parks

**Symptom:** Same park appears multiple times

**Solution:** The processing script automatically deduplicates by bringfido_id. If still seeing duplicates, check:
- Different pages have overlapping results
- Same park with slightly different names

## File Structure

```
scripts/
├── data/
│   ├── wisconsin-parks.json     ✅ Completed
│   ├── illinois-parks.json      ✅ Completed
│   ├── minnesota-parks.json     ✅ Completed
│   ├── california-parks.json    📄 Collected
│   ├── texas-parks.json         📄 Collected
│   └── ...                      ⏳ Pending
├── us-states.js                 # State definitions
├── scrape-bringfido-state.js    # Automated scraper
├── batch-process-states.js      # Batch processor
├── process-bringfido-data.js    # SQL generator
└── US-STATES-SCRAPING-GUIDE.md  # This guide
```

## Contributing

When you complete a state:

1. Save data to `scripts/data/<state>-parks.json`
2. Run validation: `node scripts/validate-state-data.js <state>`
3. Generate SQL: `node scripts/batch-process-states.js --state=<state>`
4. Update this guide with completion status
5. Commit the JSON file and generated SQL

## Notes

- BringFido pages use JSON-LD structured data which is reliable for scraping
- Each state has 20-300+ dog parks
- Rate limiting is built into the scraper (3s between pages, 5s between states)
- Total estimated time for all states: 6-8 hours
- Consider splitting work among team members by region

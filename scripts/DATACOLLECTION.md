# Dog Park Data Collection Standards

## Required Fields (CRITICAL)

All dog park records **MUST** have these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✅ Yes | Park name |
| `description` | ✅ **YES** | Detailed description with ratings, hours, amenities |
| `latitude` | ✅ **YES** | GPS latitude coordinate |
| `longitude` | ✅ **YES** | GPS longitude coordinate |
| `street` | ⚠️ Preferred | Street address |
| `city` | ⚠️ Preferred | City name |
| `state` | ✅ Yes | State abbreviation |
| `zip` | ⚠️ Preferred | ZIP code |

## Data Quality Validation

Run validation before committing data:

```bash
node scripts/validate-park-data.js <state-slug>
```

**Validation will FAIL if:**
- Any park is missing a description
- Any park is missing coordinates (lat/lng)

**Validation will WARN but pass if:**
- Street address is missing
- ZIP code is missing

## Scraping from DogParkList.com

### Step 1: Scrape State Data

```bash
node scripts/scrape-dogparklist.js <state-slug>

# Example:
node scripts/scrape-dogparklist.js california
node scripts/scrape-dogparklist.js texas
node scripts/scrape-dogparklist.js florida
```

This will:
1. Load the state page
2. Find all cities
3. For each city, find all parks
4. For EACH park, load its detail page to get:
   - Full description
   - GPS coordinates
   - Complete address

### Step 2: Validate Data

```bash
node scripts/validate-park-data.js tennessee
```

Expected output:
```
📊 Data Quality Stats:
  Total parks: 68
  With description: 68/68 (100%)
  With coordinates: 68/68 (100%)

✅ VALIDATION PASSED - All parks have required descriptions and coordinates!
```

### Step 3: Generate SQL

```bash
node scripts/process-dogparklist-data.js scripts/data/<state>-parks.json
```

This creates: `supabase/migrations/XXXXX_seed_<state>_parks.sql`

## Re-scraping If Data Is Incomplete

If validation shows missing descriptions or coordinates:

1. Delete the old JSON file:
   ```bash
   rm scripts/data/tennessee-parks.json
   ```

2. Re-run the scraper (it now fetches ALL park details):
   ```bash
   node scripts/scrape-dogparklist.js tennessee
   ```

3. Validate again:
   ```bash
   node scripts/validate-park-data.js tennessee
   ```

## Current Data Status

| State | Parks | Descriptions | Coordinates | Status |
|-------|-------|--------------|-------------|--------|
| Tennessee | 68 | 100% | 100% | ✅ Ready |
| (Add more as collected) | | | | |

## Data Source

- **Website**: https://dogparklist.com
- **Structure**: `/parks/{state}/{city}/{park-name}-{id}.html`
- **Data Available**: Name, address, coordinates, description, ratings, hours

## Important Notes

1. **Always validate before generating SQL**
2. **Never commit data with missing descriptions or coordinates**
3. **The scraper fetches detail pages for ALL parks to ensure complete data**
4. **Scraping takes longer now (~2-3 minutes per state) but ensures quality**

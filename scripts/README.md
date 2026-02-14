# Wisconsin Dog Parks Data Import

This directory contains scripts to fetch and process Wisconsin dog park data from BringFido.com.

## Source: BringFido Wisconsin Dog Parks

- **Page URL:** https://www.bringfido.com/attraction/parks/state/wisconsin/
- **Pagination:** The page shows 20 parks at a time. "See More Results" loads more. Paginated URLs: `?page=2`, `?page=3`, etc.  
  Example: https://www.bringfido.com/attraction/parks/state/wisconsin/?page=2
- **Structured data:** The page includes **JSON-LD** (e.g. `<script type="application/ld+json">`) with structured park data (name, address, geo, description). Parsing that is more reliable than scraping the DOM.

## Status

✅ **SQL file generated** (from sample or from `scripts/data/` JSON).

📄 Location: `supabase/migrations/00004_seed_wi_parks.sql` (or later migration).

## What Was Done

1. Scripts parse both the BringFido API response format and JSON-LD–style data (e.g. `name`, `street`, `city`, `state`, `zip`, `latitude`, `longitude`, `description`).
2. Amenities are detected from park descriptions:
   - `waste_bags`, `picnic_tables`, `benches`, `shade_trees`
   - `water_access`, `agility_equipment`, `fenced`, `walking_trails`
   - `parking`, `restroom`, `lighting`, `separate_areas`, `training_area`, `double_gated`
3. Boolean flags from descriptions:
   - `is_fenced`, `has_water`, `has_shade` (with "no water" etc. handled).

## Getting More Parks

### Option 1: JSON-LD from the listing page

1. Open https://www.bringfido.com/attraction/parks/state/wisconsin/ (and `?page=2`, `?page=3`, …).
2. In DevTools → Elements, search for `application/ld+json` or inspect the page source for `<script type="application/ld+json">`.
3. Copy the JSON (or extract parks from it) and save to `scripts/data/bringfido-parks.json` (or use the format expected by `process-bringfido-data.js`).
4. Run: `node scripts/process-bringfido-data.js`

### Option 2: API (if not blocked)

`fetch-wi-dog-parks.js` uses the internal API:  
`/attraction/?state=wisconsin&type=P&start=0` (then `start=20`, `40`, …).  
If that works: `node scripts/fetch-wi-dog-parks.js`

### Option 3: Manual JSON

1. Get park data (e.g. from JSON-LD or DevTools XHR to `/attraction/?state=wisconsin&type=P&start=...`).
2. Save as `scripts/data/bringfido-parks.json`: either `{ "results": [ ... ] }` or an array of park objects. Each park can have:
   - **API style:** `name`, `summary`, `address`, `latitude`, `longitude` (and optional `city.name`).
   - **JSON-LD style:** `name`, `street`, `city`, `state`, `zip`, `latitude`, `longitude`, `description`. (Address is built from street/city/state/zip.)
3. Run: `node scripts/process-bringfido-data.js`

### Option 4: Using existing data

If `scripts/data/wisconsin-parks.json` (or similar) already has the JSON-LD–style fields, run the processor; it will normalize and generate SQL.

## File Structure

```
scripts/
├── README.md                    # This file
├── fetch-wi-dog-parks.js        # Original fetch script (blocked by Cloudflare)
├── fetch-wi-parks-curl.sh       # Curl version (also blocked)
├── generate-wi-parks-sql.js     # Uses sample 20 parks (✅ WORKING)
├── process-bringfido-data.js    # Processes JSON from data/ folder
└── data/                        # Create this folder for manual data
    └── bringfido-parks.json     # Put fetched JSON here
```

## Generated SQL Preview

```sql
INSERT INTO parks (name, description, latitude, longitude, address, amenities, is_fenced, has_water, has_shade)
VALUES
  ('Dog Park at Yahara Heights County Park', 'Dogs can play off leash...', 43.1546004, -89.40536, '5488 Catfish Ct, Waunakee, WI 53597', ARRAY['water_access']::text[], false, true, false),
  ('Platteville Community Dog Park', 'Nestled against the Rountree Branch...', 42.7323588, -90.4648979, '946 Valley Rd, Platteville, WI 53818', ARRAY['fenced','parking','picnic_tables','restroom','separate_areas','shade_trees','walking_trails','waste_bags']::text[], true, false, true),
  -- ... 18 more parks
```

## Next Steps

1. Review the generated SQL file: `supabase/migrations/00004_seed_wi_parks.sql`
2. If satisfied with 20 parks, apply the migration
3. If you want all 138 parks, manually fetch the data using Option 1 above

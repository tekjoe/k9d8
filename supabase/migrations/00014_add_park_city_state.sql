-- Add city and state columns to parks table for directory/SEO pages
ALTER TABLE parks ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE parks ADD COLUMN IF NOT EXISTS state text;

-- Backfill from address field: "123 Main St, Madison, WI" → city="Madison", state="WI"
-- Pattern: last segment is state (2-letter code), second-to-last is city
UPDATE parks
SET
  city = trim(split_part(split_part(address, ',', -2), ',', 1)),
  state = trim(split_part(address, ',', -1))
WHERE address IS NOT NULL
  AND address LIKE '%,%';

-- Index for directory queries
CREATE INDEX IF NOT EXISTS idx_parks_state ON parks (state);
CREATE INDEX IF NOT EXISTS idx_parks_city_state ON parks (city, state);

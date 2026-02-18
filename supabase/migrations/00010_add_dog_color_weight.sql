-- Add color and weight fields to dogs table
ALTER TABLE dogs
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS weight_lbs INTEGER;
-- Add comments for documentation
COMMENT ON COLUMN dogs.color IS 'The dog''s coat color (e.g., Golden, Black, Brown)';
COMMENT ON COLUMN dogs.weight_lbs IS 'The dog''s weight in pounds';

-- Migration: Change temperament from single enum to array of enums
-- This allows dogs to have multiple temperament traits

-- Step 1: Add a new column for the array
ALTER TABLE dogs ADD COLUMN temperaments dog_temperament[] DEFAULT ARRAY['friendly']::dog_temperament[];
-- Step 2: Migrate existing data - convert single temperament to array
UPDATE dogs SET temperaments = ARRAY[temperament]::dog_temperament[] WHERE temperament IS NOT NULL;
-- Step 3: Drop the old column
ALTER TABLE dogs DROP COLUMN temperament;
-- Step 4: Rename the new column to temperament (keeping it as array)
ALTER TABLE dogs RENAME COLUMN temperaments TO temperament;
-- Step 5: Set NOT NULL constraint
ALTER TABLE dogs ALTER COLUMN temperament SET NOT NULL;

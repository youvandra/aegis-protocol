/*
  # Remove release_type column from groups table

  1. Schema Changes
    - Remove `release_type` column from `groups` table
    - Remove associated check constraint for release_type
  
  2. Rationale
    - Simplifying group model to only support specific date releases
    - Monthly releases are no longer needed in the application
    - Reduces complexity and improves data model clarity

  3. Impact
    - All groups will now be treated as one-time releases with specific dates
    - No data loss as we're only removing the type classification
*/

-- Remove the check constraint first
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'groups_release_type_check' 
    AND table_name = 'groups'
  ) THEN
    ALTER TABLE groups DROP CONSTRAINT groups_release_type_check;
  END IF;
END $$;

-- Remove the release_type column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'groups' AND column_name = 'release_type'
  ) THEN
    ALTER TABLE groups DROP COLUMN release_type;
  END IF;
END $$;
/*
  # Update release_date to timestamp with time zone

  1. Schema Changes
    - Change `release_date` column from `date` to `timestamp with time zone`
    - This allows storing both date and time information
    - Preserves existing data by converting dates to timestamps

  2. Data Migration
    - Existing date values will be converted to timestamps at midnight UTC
    - New entries will store full timestamp information including time

  3. Benefits
    - Precise scheduling with exact time
    - Better timezone handling
    - Real-time data display instead of static formatting
*/

-- Change the release_date column type from date to timestamp with time zone
DO $$
BEGIN
  -- Check if the column exists and is of type date
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'groups' 
    AND column_name = 'release_date' 
    AND data_type = 'date'
  ) THEN
    -- Convert the column type
    ALTER TABLE groups 
    ALTER COLUMN release_date TYPE timestamp with time zone 
    USING release_date::timestamp with time zone;
    
    RAISE NOTICE 'Successfully converted release_date from date to timestamp with time zone';
  ELSE
    RAISE NOTICE 'Column release_date is already timestamp with time zone or does not exist';
  END IF;
END $$;
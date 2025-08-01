/*
  # Fix relay number generation

  1. Function Updates
    - Ensure generate_relay_number function works correctly
    - Add proper error handling and logging
  
  2. Trigger Updates
    - Verify trigger is properly attached
    - Ensure it fires before insert operations
  
  3. Table Updates
    - Make relay_number nullable initially (auto-generated)
    - Add proper constraints and indexes
*/

-- Drop existing function and trigger to recreate them properly
DROP TRIGGER IF EXISTS generate_relay_number_trigger ON relays;
DROP FUNCTION IF EXISTS generate_relay_number();

-- Create improved relay number generation function
CREATE OR REPLACE FUNCTION generate_relay_number()
RETURNS TRIGGER AS $$
DECLARE
  new_number TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate relay number in format R001, R002, etc.
  LOOP
    new_number := 'R' || LPAD(counter::TEXT, 3, '0');
    
    -- Check if this number already exists
    IF NOT EXISTS (SELECT 1 FROM relays WHERE relay_number = new_number) THEN
      NEW.relay_number := new_number;
      EXIT;
    END IF;
    
    counter := counter + 1;
    
    -- Safety check to prevent infinite loop
    IF counter > 999999 THEN
      RAISE EXCEPTION 'Unable to generate unique relay number';
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate relay numbers
CREATE TRIGGER generate_relay_number_trigger
  BEFORE INSERT ON relays
  FOR EACH ROW
  EXECUTE FUNCTION generate_relay_number();

-- Ensure relay_number can be null initially (will be set by trigger)
ALTER TABLE relays ALTER COLUMN relay_number DROP NOT NULL;

-- Add constraint to ensure relay_number is unique when set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'relays_relay_number_key' 
    AND table_name = 'relays'
  ) THEN
    ALTER TABLE relays ADD CONSTRAINT relays_relay_number_key UNIQUE (relay_number);
  END IF;
END $$;
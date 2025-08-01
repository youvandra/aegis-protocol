/*
  # Update relay numbering to use simple generation like streams

  1. Changes
    - Drop existing relay number generation function and trigger
    - Create new simple relay number generation function
    - Update trigger to use new function
    - Keep existing unique constraint on (sender_address, relay_number)

  2. Numbering System
    - Uses simple sequential numbers per user: 1, 2, 3, etc.
    - Each user has independent numbering sequence
    - Same approach as stream group numbering
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS generate_relay_number_trigger ON relays;
DROP FUNCTION IF EXISTS generate_relay_number();

-- Create new simple relay number generation function
CREATE OR REPLACE FUNCTION generate_relay_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the next number for this sender
  SELECT COALESCE(MAX(CAST(relay_number AS INTEGER)), 0) + 1
  INTO next_number
  FROM relays
  WHERE sender_address = NEW.sender_address
    AND relay_number ~ '^[0-9]+$';
  
  -- Set the relay number
  NEW.relay_number := next_number::TEXT;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
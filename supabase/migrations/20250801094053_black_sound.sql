/*
  # Fix relay number generation for multiple users

  1. Database Changes
    - Update relay number generation to be user-specific
    - Each user gets their own sequence: R001, R002, R003...
    - Remove global uniqueness constraint on relay_number
    - Add composite unique constraint on (sender_address, relay_number)

  2. Function Updates
    - Generate relay numbers based on sender's existing relays
    - Each user starts from R001 for their first relay
    - Prevents conflicts between different users

  3. Security
    - Maintains RLS policies
    - Each user can only see and manage their own relays
*/

-- Drop existing unique constraint on relay_number
ALTER TABLE relays DROP CONSTRAINT IF EXISTS relays_relay_number_key;

-- Add composite unique constraint for sender_address + relay_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'relays_sender_relay_number_unique'
  ) THEN
    ALTER TABLE relays ADD CONSTRAINT relays_sender_relay_number_unique 
    UNIQUE (sender_address, relay_number);
  END IF;
END $$;

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS generate_relay_number_trigger ON relays;
DROP FUNCTION IF EXISTS generate_relay_number();

-- Create new user-specific relay number generation function
CREATE OR REPLACE FUNCTION generate_relay_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_relay_number TEXT;
  max_attempts INTEGER := 100;
  attempt_count INTEGER := 0;
BEGIN
  -- Only generate if relay_number is not already set
  IF NEW.relay_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    -- Get the next number for this specific sender
    SELECT COALESCE(MAX(CAST(SUBSTRING(relay_number FROM 2) AS INTEGER)), 0) + 1
    INTO next_number
    FROM relays 
    WHERE sender_address = NEW.sender_address 
    AND relay_number ~ '^R[0-9]+$';

    -- Format as R001, R002, etc.
    new_relay_number := 'R' || LPAD(next_number::TEXT, 3, '0');

    -- Check if this number already exists for this sender
    IF NOT EXISTS (
      SELECT 1 FROM relays 
      WHERE sender_address = NEW.sender_address 
      AND relay_number = new_relay_number
    ) THEN
      NEW.relay_number := new_relay_number;
      EXIT;
    END IF;

    -- Safety check to prevent infinite loops
    attempt_count := attempt_count + 1;
    IF attempt_count >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique relay number after % attempts', max_attempts;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for relay number generation
CREATE TRIGGER generate_relay_number_trigger
  BEFORE INSERT ON relays
  FOR EACH ROW
  EXECUTE FUNCTION generate_relay_number();

-- Update index to reflect new constraint
DROP INDEX IF EXISTS relays_relay_number_key;
CREATE INDEX IF NOT EXISTS idx_relays_sender_relay_number 
ON relays (sender_address, relay_number);
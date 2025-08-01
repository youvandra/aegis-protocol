/*
  # Fix Relay Numbering System

  1. Database Functions
    - Update `generate_relay_number()` function to properly generate sequential numbers per sender
    - Ensure robust handling of numeric relay numbers only
    - Handle edge cases for new senders (start from 1)

  2. Triggers
    - Recreate trigger to ensure proper function execution
    - Apply to all new relay insertions

  3. Data Integrity
    - Use proper casting and filtering for numeric values
    - Prevent conflicts with existing data
*/

-- Drop existing trigger to recreate it properly
DROP TRIGGER IF EXISTS generate_relay_number_trigger ON public.relays;

-- Create or replace the relay number generation function
CREATE OR REPLACE FUNCTION public.generate_relay_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INT;
BEGIN
    -- Find the maximum existing numeric relay_number for the current sender
    -- Only consider relay_number values that are purely numeric
    SELECT COALESCE(MAX(CAST(r.relay_number AS INT)), 0) + 1
    INTO next_num
    FROM public.relays r
    WHERE r.sender_address = NEW.sender_address
      AND r.relay_number IS NOT NULL
      AND r.relay_number ~ '^[0-9]+$'; -- Only consider numeric strings

    -- Set the new relay number as a string
    NEW.relay_number := next_num::TEXT;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error, start from 1
        NEW.relay_number := '1';
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to automatically generate relay numbers
CREATE TRIGGER generate_relay_number_trigger
    BEFORE INSERT ON public.relays
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_relay_number();

-- Ensure the relay_number column allows NULL initially (gets set by trigger)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'relays' 
        AND column_name = 'relay_number'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.relays ALTER COLUMN relay_number DROP NOT NULL;
    END IF;
END $$;
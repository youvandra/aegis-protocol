/*
  # Implement Random Number Generation for Relay and Stream Tables

  1. Database Functions
    - `generate_random_group_number()` - Generates random 6-digit group numbers
    - `generate_random_relay_number()` - Generates random 6-digit relay numbers
  
  2. Triggers
    - Updates existing triggers to use new random generation functions
    - Ensures uniqueness through retry logic with collision detection
  
  3. Safety Features
    - Retry mechanism for handling collisions
    - Fallback to timestamp-based numbers if retries fail
    - Maintains existing data integrity
*/

-- Function to generate random group numbers
CREATE OR REPLACE FUNCTION public.generate_random_group_number()
RETURNS TRIGGER AS $$
DECLARE
    random_num TEXT;
    attempt_count INT := 0;
    max_attempts INT := 10;
BEGIN
    -- Generate random 6-digit number with retry logic
    LOOP
        -- Generate random number between 100000 and 999999
        random_num := (100000 + floor(random() * 900000))::TEXT;
        
        -- Check if this number already exists for this sender
        IF NOT EXISTS (
            SELECT 1 FROM public.groups 
            WHERE group_number = random_num 
            AND wallet_address = NEW.wallet_address
        ) THEN
            -- Number is unique for this user, use it
            NEW.group_number := random_num;
            RETURN NEW;
        END IF;
        
        attempt_count := attempt_count + 1;
        
        -- If we've tried too many times, fall back to timestamp-based number
        IF attempt_count >= max_attempts THEN
            NEW.group_number := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT;
            RETURN NEW;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate random relay numbers
CREATE OR REPLACE FUNCTION public.generate_random_relay_number()
RETURNS TRIGGER AS $$
DECLARE
    random_num TEXT;
    attempt_count INT := 0;
    max_attempts INT := 10;
BEGIN
    -- Generate random 6-digit number with retry logic
    LOOP
        -- Generate random number between 100000 and 999999
        random_num := (100000 + floor(random() * 900000))::TEXT;
        
        -- Check if this number already exists for this sender
        IF NOT EXISTS (
            SELECT 1 FROM public.relays 
            WHERE relay_number = random_num 
            AND sender_address = NEW.sender_address
        ) THEN
            -- Number is unique for this user, use it
            NEW.relay_number := random_num;
            RETURN NEW;
        END IF;
        
        attempt_count := attempt_count + 1;
        
        -- If we've tried too many times, fall back to timestamp-based number
        IF attempt_count >= max_attempts THEN
            NEW.relay_number := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT;
            RETURN NEW;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the group number generation trigger
DROP TRIGGER IF EXISTS generate_group_number_trigger ON public.groups;
CREATE TRIGGER generate_group_number_trigger
    BEFORE INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_random_group_number();

-- Update the relay number generation trigger
DROP TRIGGER IF EXISTS generate_relay_number_trigger ON public.relays;
CREATE TRIGGER generate_relay_number_trigger
    BEFORE INSERT ON public.relays
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_random_relay_number();

-- Ensure relay_number column allows NULL initially (gets set by trigger)
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
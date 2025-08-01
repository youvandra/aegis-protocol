/*
  # Add expiration functionality to relays

  1. Schema Changes
    - Add `expires_at` column to relays table
    - Update status constraint to include 'Expired'
    - Add index for efficient expiration queries

  2. Security
    - Maintain existing RLS policies
    - No changes to permissions

  3. Notes
    - Existing relays will have NULL expires_at (no expiration)
    - New relays can optionally set expiration time
*/

-- Add expires_at column to relays table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'relays' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE relays ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Update status constraint to include 'Expired'
ALTER TABLE relays DROP CONSTRAINT IF EXISTS relays_status_check;
ALTER TABLE relays ADD CONSTRAINT relays_status_check 
  CHECK (status = ANY (ARRAY[
    'Request Initiated'::text, 
    'Waiting for Receiver''s Approval'::text, 
    'Waiting for Sender to Execute'::text, 
    'Complete'::text, 
    'Rejected'::text,
    'Expired'::text
  ]));

-- Add index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_relays_expires_at ON relays (expires_at);

-- Create function to automatically expire relays
CREATE OR REPLACE FUNCTION expire_old_relays()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE relays 
  SET status = 'Expired'
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND status NOT IN ('Complete', 'Rejected', 'Expired');
END $$;
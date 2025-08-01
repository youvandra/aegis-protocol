/*
  # Create relay system tables

  1. New Tables
    - `relays`
      - `id` (uuid, primary key)
      - `relay_number` (text, unique, auto-generated)
      - `sender_address` (text, wallet that creates the relay)
      - `receiver_address` (text, wallet that receives the relay)
      - `amount` (numeric, amount to transfer)
      - `status` (text, current relay status)
      - `transaction_hash` (text, optional blockchain transaction hash)
      - `gas_used` (text, optional gas information)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `relays` table
    - Add policies for users to see relays they created or are receiving
    - Add policies for updating relay status

  3. Functions
    - Auto-generate relay numbers with RLY- prefix
    - Auto-update timestamps
*/

-- Function to generate relay numbers
CREATE OR REPLACE FUNCTION generate_relay_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.relay_number IS NULL THEN
    NEW.relay_number := 'RLY-' || LPAD(
      (
        SELECT COALESCE(
          MAX(CAST(SUBSTRING(relay_number FROM 5) AS INTEGER)), 
          0
        ) + 1
        FROM relays 
        WHERE relay_number ~ '^RLY-[0-9]+$'
      )::TEXT, 
      3, 
      '0'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_relay_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create relays table
CREATE TABLE IF NOT EXISTS relays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relay_number text UNIQUE,
  sender_address text NOT NULL,
  receiver_address text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'Request Initiated' CHECK (
    status IN (
      'Request Initiated',
      'Waiting for Receiver''s Approval',
      'Waiting for Sender to Execute',
      'Complete',
      'Rejected'
    )
  ),
  transaction_hash text,
  gas_used text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_relays_sender_address ON relays (sender_address);
CREATE INDEX IF NOT EXISTS idx_relays_receiver_address ON relays (receiver_address);
CREATE INDEX IF NOT EXISTS idx_relays_status ON relays (status);
CREATE INDEX IF NOT EXISTS idx_relays_created_at ON relays (created_at DESC);

-- Add triggers
CREATE TRIGGER generate_relay_number_trigger
  BEFORE INSERT ON relays
  FOR EACH ROW
  EXECUTE FUNCTION generate_relay_number();

CREATE TRIGGER update_relay_updated_at
  BEFORE UPDATE ON relays
  FOR EACH ROW
  EXECUTE FUNCTION update_relay_updated_at_column();

-- Enable RLS
ALTER TABLE relays ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see relays they created (as sender)
CREATE POLICY "Users can see relays they created"
  ON relays
  FOR SELECT
  TO anon
  USING (sender_address = lower(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)));

-- Users can see relays they are receiving
CREATE POLICY "Users can see relays they are receiving"
  ON relays
  FOR SELECT
  TO anon
  USING (receiver_address = lower(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)));

-- Users can create relays (as sender)
CREATE POLICY "Users can create relays"
  ON relays
  FOR INSERT
  TO anon
  WITH CHECK (sender_address = lower(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)));

-- Users can update relays they created (as sender)
CREATE POLICY "Senders can update their relays"
  ON relays
  FOR UPDATE
  TO anon
  USING (sender_address = lower(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)))
  WITH CHECK (sender_address = lower(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)));

-- Users can update relays they are receiving (for approval/rejection)
CREATE POLICY "Receivers can update relay status"
  ON relays
  FOR UPDATE
  TO anon
  USING (receiver_address = lower(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)))
  WITH CHECK (receiver_address = lower(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)));
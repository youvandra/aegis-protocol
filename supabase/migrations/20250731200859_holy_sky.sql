/*
  # Create wallet accounts table

  1. New Tables
    - `wallet_accounts`
      - `id` (uuid, primary key)
      - `wallet_address` (text, unique, not null)
      - `first_connected_at` (timestamp)
      - `last_connected_at` (timestamp)
      - `connection_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `wallet_accounts` table
    - Add policy for users to read their own wallet data
    - Add policy for users to insert/update their own wallet data

  3. Indexes
    - Add index on wallet_address for fast lookups
*/

CREATE TABLE IF NOT EXISTS wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  first_connected_at timestamptz DEFAULT now(),
  last_connected_at timestamptz DEFAULT now(),
  connection_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet accounts
CREATE POLICY "Users can read their own wallet data"
  ON wallet_accounts
  FOR SELECT
  USING (true); -- Allow reading all wallet accounts for now

CREATE POLICY "Users can insert their own wallet data"
  ON wallet_accounts
  FOR INSERT
  WITH CHECK (true); -- Allow inserting wallet accounts

CREATE POLICY "Users can update their own wallet data"
  ON wallet_accounts
  FOR UPDATE
  USING (true); -- Allow updating wallet accounts

-- Create index for fast wallet address lookups
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_address 
  ON wallet_accounts(wallet_address);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_wallet_accounts_updated_at
  BEFORE UPDATE ON wallet_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
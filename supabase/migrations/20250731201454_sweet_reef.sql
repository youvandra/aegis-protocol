/*
  # Create wallet accounts table

  1. New Tables
    - `wallet_accounts`
      - `id` (uuid, primary key)
      - `wallet_address` (text, unique, not null)
      - `first_connected_at` (timestamptz, default now())
      - `last_connected_at` (timestamptz, default now())
      - `connection_count` (integer, default 1)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `wallet_accounts` table
    - Add policies for public access (since we're not using Supabase auth)
    - Add trigger for updating `updated_at` timestamp

  3. Indexes
    - Index on `wallet_address` for fast lookups
    - Unique constraint on `wallet_address`
*/

-- Create the wallet_accounts table
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

-- Create policies for public access (since we're not using Supabase auth)
CREATE POLICY "Allow public read access to wallet accounts"
  ON wallet_accounts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to wallet accounts"
  ON wallet_accounts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to wallet accounts"
  ON wallet_accounts
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_address 
  ON wallet_accounts (wallet_address);

-- Create function to update updated_at timestamp
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
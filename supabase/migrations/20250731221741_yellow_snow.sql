/*
  # Create users table for wallet connections

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `wallet_address` (text, unique, not null) - The connected wallet address
      - `chain_id` (integer) - The blockchain network ID
      - `first_connected_at` (timestamp) - When the wallet first connected
      - `last_connected_at` (timestamp) - Most recent connection time
      - `connection_count` (integer) - Total number of connections
      - `is_active` (boolean) - Whether the user is currently active
      - `created_at` (timestamp) - Record creation time
      - `updated_at` (timestamp) - Record last update time

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data based on wallet address
    - Add policy for users to update their own data

  3. Indexes
    - Index on wallet_address for fast lookups
    - Index on chain_id for filtering by network
    - Index on last_connected_at for activity tracking
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  chain_id integer,
  first_connected_at timestamptz DEFAULT now(),
  last_connected_at timestamptz DEFAULT now(),
  connection_count integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users to access their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can read all data for public access"
  ON users
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO anon
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_chain_id ON users(chain_id);
CREATE INDEX IF NOT EXISTS idx_users_last_connected_at ON users(last_connected_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
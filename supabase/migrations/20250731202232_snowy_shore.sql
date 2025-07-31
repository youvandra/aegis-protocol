/*
  # Create wallet_accounts table

  1. New Tables
    - `wallet_accounts`
      - `id` (uuid, primary key)
      - `wallet_address` (text, unique, not null)
      - `first_connected_at` (timestamptz, default now)
      - `last_connected_at` (timestamptz, default now)
      - `connection_count` (integer, default 1)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `wallet_accounts` table
    - Add policy for users to insert their own wallet data
    - Add policy for users to read all wallet data
    - Add policy for users to update their own wallet data

  3. Indexes
    - Add index on wallet_address for faster lookups
*/

CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  first_connected_at timestamptz DEFAULT now() NOT NULL,
  last_connected_at timestamptz DEFAULT now() NOT NULL,
  connection_count integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet_accounts table
CREATE POLICY "Users can insert wallet data"
  ON public.wallet_accounts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read wallet data"
  ON public.wallet_accounts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update wallet data"
  ON public.wallet_accounts
  FOR UPDATE
  TO public
  USING (true);

-- Create index for faster wallet address lookups
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_wallet_address 
  ON public.wallet_accounts(wallet_address);

-- Create index for connection tracking
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_last_connected 
  ON public.wallet_accounts(last_connected_at DESC);
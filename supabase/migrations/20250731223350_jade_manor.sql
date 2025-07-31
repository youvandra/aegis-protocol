/*
  # Update Groups RLS Policies

  1. Security Updates
    - Update RLS policies to use wallet_address instead of user_id
    - Allow anonymous users to create and manage groups using wallet address
    - Ensure proper authentication context for wallet-based operations

  2. Changes
    - Modified INSERT policy to allow wallet address-based creation
    - Updated SELECT policy for wallet address filtering
    - Updated UPDATE policy for wallet address ownership
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own groups" ON groups;
DROP POLICY IF EXISTS "Users can read own groups" ON groups;
DROP POLICY IF EXISTS "Users can update own groups" ON groups;

-- Create new policies that work with wallet addresses
CREATE POLICY "Users can insert own groups"
  ON groups
  FOR INSERT
  TO anon
  WITH CHECK (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Users can read own groups"
  ON groups
  FOR SELECT
  TO anon
  USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Users can update own groups"
  ON groups
  FOR UPDATE
  TO anon
  USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));
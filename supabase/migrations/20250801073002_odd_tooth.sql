/*
  # Fix RLS policies for wallet-based data isolation

  1. Security Updates
    - Update all RLS policies to use wallet_address matching
    - Ensure users can only see their own data
    - Remove overly permissive anonymous access policies
    - Add proper wallet-based access control

  2. Tables Updated
    - `users`: Users can only see their own wallet data
    - `groups`: Users can only see groups they created
    - `members`: Users can only see members of their groups
    - `legacy_plans`: Users can only see their own legacy plans
    - `beneficiaries`: Users can only see beneficiaries of their legacy plans

  3. Implementation
    - Use current_setting to get wallet address from request headers
    - Implement proper cascading access control
*/

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow anonymous select on users" ON users;
DROP POLICY IF EXISTS "Allow anonymous insert on users" ON users;
DROP POLICY IF EXISTS "Allow anonymous update on users" ON users;
DROP POLICY IF EXISTS "Allow anonymous delete on users" ON users;

DROP POLICY IF EXISTS "Allow anonymous select on groups" ON groups;
DROP POLICY IF EXISTS "Allow anonymous insert on groups" ON groups;
DROP POLICY IF EXISTS "Allow anonymous update on groups" ON groups;
DROP POLICY IF EXISTS "Allow anonymous delete on groups" ON groups;

DROP POLICY IF EXISTS "Allow all member operations" ON members;

DROP POLICY IF EXISTS "Allow anonymous access to legacy_plans" ON legacy_plans;
DROP POLICY IF EXISTS "Allow anonymous access to beneficiaries" ON beneficiaries;

-- Create wallet-based RLS policies for users table
CREATE POLICY "Users can manage own wallet data"
  ON users
  FOR ALL
  TO anon
  USING (wallet_address = lower(current_setting('request.headers')::json->>'x-wallet-address'))
  WITH CHECK (wallet_address = lower(current_setting('request.headers')::json->>'x-wallet-address'));

-- Create wallet-based RLS policies for groups table
CREATE POLICY "Users can manage own groups"
  ON groups
  FOR ALL
  TO anon
  USING (wallet_address = lower(current_setting('request.headers')::json->>'x-wallet-address'))
  WITH CHECK (wallet_address = lower(current_setting('request.headers')::json->>'x-wallet-address'));

-- Create wallet-based RLS policies for members table
CREATE POLICY "Users can manage members of own groups"
  ON members
  FOR ALL
  TO anon
  USING (
    group_id IN (
      SELECT id FROM groups 
      WHERE wallet_address = lower(current_setting('request.headers')::json->>'x-wallet-address')
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups 
      WHERE wallet_address = lower(current_setting('request.headers')::json->>'x-wallet-address')
    )
  );

-- Create wallet-based RLS policies for legacy_plans table
CREATE POLICY "Users can manage own legacy plans"
  ON legacy_plans
  FOR ALL
  TO anon
  USING (wallet_address = lower(current_setting('request.headers')::json->>'x-wallet-address'))
  WITH CHECK (wallet_address = lower(current_setting('request.headers')::json->>'x-wallet-address'));

-- Create wallet-based RLS policies for beneficiaries table
CREATE POLICY "Users can manage beneficiaries of own legacy plans"
  ON beneficiaries
  FOR ALL
  TO anon
  USING (
    legacy_plan_id IN (
      SELECT id FROM legacy_plans 
      WHERE wallet_address = lower(current_setting('request.headers')::json->>'x-wallet-address')
    )
  )
  WITH CHECK (
    legacy_plan_id IN (
      SELECT id FROM legacy_plans 
      WHERE wallet_address = lower(current_setting('request.headers')::json->>'x-wallet-address')
    )
  );
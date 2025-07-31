/*
  # Update groups table RLS policies for open access

  1. Security Changes
    - Drop existing restrictive RLS policies on groups table
    - Add new open policies allowing any user to create and access group data
    - Remove wallet address restrictions for easier development and testing

  2. Policy Updates
    - Allow anonymous users to insert any group data
    - Allow anonymous users to select any group data
    - Allow anonymous users to update any group data
    - Allow anonymous users to delete any group data
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own groups" ON groups;
DROP POLICY IF EXISTS "Users can read own groups" ON groups;
DROP POLICY IF EXISTS "Users can update own groups" ON groups;

-- Create open access policies for groups table
CREATE POLICY "Allow anonymous insert on groups"
  ON groups
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on groups"
  ON groups
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update on groups"
  ON groups
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on groups"
  ON groups
  FOR DELETE
  TO anon
  USING (true);
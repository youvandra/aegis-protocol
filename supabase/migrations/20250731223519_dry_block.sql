/*
  # Update users table permissions for open access

  1. Security Changes
    - Drop existing restrictive RLS policies on users table
    - Add new permissive policies allowing anonymous users to:
      - Insert any user data
      - Select any user data  
      - Update any user data
    - This enables wallet-based user creation without authentication restrictions

  2. Notes
    - Allows anonymous users to create and manage user records
    - Enables seamless wallet connection tracking
    - Removes authentication barriers for user data operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can read all data for public access" ON users;

-- Create new permissive policies for anonymous access
CREATE POLICY "Allow anonymous insert on users"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on users"
  ON users
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update on users"
  ON users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on users"
  ON users
  FOR DELETE
  TO anon
  USING (true);
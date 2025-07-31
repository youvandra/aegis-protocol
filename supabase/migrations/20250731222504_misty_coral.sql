/*
  # Create Stream Tables

  1. New Tables
    - `groups`
      - `id` (uuid, primary key)
      - `group_number` (text, unique)
      - `group_name` (text)
      - `release_date` (date, nullable for monthly groups)
      - `release_type` (text, 'monthly' or 'one-time')
      - `total_members` (integer, default 0)
      - `total_amount` (numeric, default 0)
      - `status` (text, default 'upcoming')
      - `wallet_address` (text, owner of the group)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `members`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key to groups)
      - `name` (text)
      - `wallet_address` (text)
      - `amount` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Users can only see groups they own and members of their groups

  3. Functions
    - Auto-update group totals when members are added/removed
    - Auto-generate group numbers
    - Update timestamps automatically
*/

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_number text UNIQUE NOT NULL,
  group_name text NOT NULL,
  release_date date,
  release_type text NOT NULL CHECK (release_type IN ('monthly', 'one-time')),
  total_members integer DEFAULT 0,
  total_amount numeric DEFAULT 0,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'released')),
  wallet_address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  wallet_address text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Users can read own groups"
  ON groups
  FOR SELECT
  TO anon
  USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Users can insert own groups"
  ON groups
  FOR INSERT
  TO anon
  WITH CHECK (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Users can update own groups"
  ON groups
  FOR UPDATE
  TO anon
  USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

-- RLS Policies for members
CREATE POLICY "Users can read members of own groups"
  ON members
  FOR SELECT
  TO anon
  USING (EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = members.group_id 
    AND groups.wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
  ));

CREATE POLICY "Users can insert members to own groups"
  ON members
  FOR INSERT
  TO anon
  WITH CHECK (EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = members.group_id 
    AND groups.wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
  ));

CREATE POLICY "Users can update members of own groups"
  ON members
  FOR UPDATE
  TO anon
  USING (EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = members.group_id 
    AND groups.wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
  ));

CREATE POLICY "Users can delete members of own groups"
  ON members
  FOR DELETE
  TO anon
  USING (EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = members.group_id 
    AND groups.wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
  ));

-- Function to update group totals
CREATE OR REPLACE FUNCTION update_group_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the group's total_members and total_amount
  UPDATE groups 
  SET 
    total_members = (
      SELECT COUNT(*) 
      FROM members 
      WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
    ),
    total_amount = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM members 
      WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.group_id, OLD.group_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update group totals
CREATE TRIGGER update_group_totals_on_member_insert
  AFTER INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_totals();

CREATE TRIGGER update_group_totals_on_member_update
  AFTER UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_totals();

CREATE TRIGGER update_group_totals_on_member_delete
  AFTER DELETE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_totals();

-- Function to generate group numbers
CREATE OR REPLACE FUNCTION generate_group_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.group_number := 'GRP-' || LPAD((
    SELECT COALESCE(MAX(CAST(SUBSTRING(group_number FROM 5) AS INTEGER)), 0) + 1
    FROM groups
    WHERE group_number ~ '^GRP-[0-9]+$'
  )::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate group numbers
CREATE TRIGGER generate_group_number_trigger
  BEFORE INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION generate_group_number();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_wallet_address ON groups(wallet_address);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
CREATE INDEX IF NOT EXISTS idx_members_group_id ON members(group_id);
CREATE INDEX IF NOT EXISTS idx_members_wallet_address ON members(wallet_address);
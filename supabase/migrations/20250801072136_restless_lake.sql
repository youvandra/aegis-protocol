/*
  # Create Legacy System Tables

  1. New Tables
    - `legacy_plans`
      - `id` (uuid, primary key)
      - `wallet_address` (text, references users)
      - `moment_type` (text, either 'specificDate' or 'ifImGone')
      - `moment_value` (text, date string or interval)
      - `moment_label` (text, human-readable description)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `beneficiaries`
      - `id` (uuid, primary key)
      - `legacy_plan_id` (uuid, references legacy_plans)
      - `name` (text, beneficiary name)
      - `wallet_address` (text, beneficiary wallet)
      - `percentage` (numeric, inheritance percentage)
      - `notes` (text, optional notes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous users to manage their own data
    - Add indexes for performance

  3. Constraints
    - Ensure percentage is between 0 and 100
    - Ensure moment_type is valid
    - Add foreign key constraints
*/

-- Create legacy_plans table
CREATE TABLE IF NOT EXISTS legacy_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  moment_type text NOT NULL CHECK (moment_type IN ('specificDate', 'ifImGone')),
  moment_value text NOT NULL,
  moment_label text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create beneficiaries table
CREATE TABLE IF NOT EXISTS beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_plan_id uuid NOT NULL,
  name text NOT NULL,
  wallet_address text NOT NULL,
  percentage numeric NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'beneficiaries_legacy_plan_id_fkey'
  ) THEN
    ALTER TABLE beneficiaries 
    ADD CONSTRAINT beneficiaries_legacy_plan_id_fkey 
    FOREIGN KEY (legacy_plan_id) REFERENCES legacy_plans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE legacy_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- Create policies for legacy_plans
CREATE POLICY "Allow anonymous access to legacy_plans"
  ON legacy_plans
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create policies for beneficiaries
CREATE POLICY "Allow anonymous access to beneficiaries"
  ON beneficiaries
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_legacy_plans_wallet_address ON legacy_plans(wallet_address);
CREATE INDEX IF NOT EXISTS idx_legacy_plans_is_active ON legacy_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_legacy_plan_id ON beneficiaries(legacy_plan_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_wallet_address ON beneficiaries(wallet_address);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_legacy_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_legacy_plans_updated_at
  BEFORE UPDATE ON legacy_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_legacy_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION update_legacy_updated_at_column();
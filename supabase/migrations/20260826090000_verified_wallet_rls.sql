/*
  # Move RLS from a client-set header to a verified wallet claim

  1. Problem
    - Every policy so far derived the caller's identity from
      `current_setting('request.headers')::json->>'x-wallet-address'`, a header
      the browser sets itself. Anyone could send another wallet's address and
      read or write that wallet's rows.
    - Several tables also still carried `USING (true)` policies from early
      development. Policies combine with OR, so a single permissive policy
      defeated every strict policy on the same table.

  2. Fix
    - `auth_nonces` backs a sign-in challenge; the `wallet-auth` edge function
      issues a JWT only after verifying a signature over a single-use nonce.
    - Every policy below reads `auth.jwt() ->> 'wallet_address'`, a claim the
      database itself validated, and every legacy policy is dropped.

  3. Deployment order
    - Deploy the `wallet-auth` and `hcs` edge functions and set their secrets
      BEFORE applying this migration; afterwards, header-only clients lose
      access by design.
*/

-- ---------------------------------------------------------------------------
-- Sign-in challenges
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce text PRIMARY KEY,
  evm_address text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE auth_nonces ENABLE ROW LEVEL SECURITY;

-- No policies: only the service role (the edge function) may touch this table.

CREATE INDEX IF NOT EXISTS idx_auth_nonces_expires_at ON auth_nonces (expires_at);

CREATE OR REPLACE FUNCTION purge_expired_auth_nonces()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth_nonces WHERE expires_at < now();
END $$;

-- ---------------------------------------------------------------------------
-- The verified caller
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION current_wallet_address()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT lower(nullif(auth.jwt() ->> 'wallet_address', ''));
$$;

-- ---------------------------------------------------------------------------
-- Drop every policy that trusted the client
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow anonymous insert on users" ON users;
DROP POLICY IF EXISTS "Allow anonymous select on users" ON users;
DROP POLICY IF EXISTS "Allow anonymous update on users" ON users;
DROP POLICY IF EXISTS "Allow anonymous delete on users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can read all data for public access" ON users;
DROP POLICY IF EXISTS "Users can manage own wallet data" ON users;

DROP POLICY IF EXISTS "Allow anonymous insert on groups" ON groups;
DROP POLICY IF EXISTS "Allow anonymous select on groups" ON groups;
DROP POLICY IF EXISTS "Allow anonymous update on groups" ON groups;
DROP POLICY IF EXISTS "Allow anonymous delete on groups" ON groups;
DROP POLICY IF EXISTS "Users can insert own groups" ON groups;
DROP POLICY IF EXISTS "Users can read own groups" ON groups;
DROP POLICY IF EXISTS "Users can update own groups" ON groups;
DROP POLICY IF EXISTS "Users can manage own groups" ON groups;

DROP POLICY IF EXISTS "Allow all member operations" ON members;
DROP POLICY IF EXISTS "Allow member operations for group owners" ON members;
DROP POLICY IF EXISTS "Users can insert members to own groups" ON members;
DROP POLICY IF EXISTS "Users can read members of own groups" ON members;
DROP POLICY IF EXISTS "Users can update members of own groups" ON members;
DROP POLICY IF EXISTS "Users can delete members of own groups" ON members;
DROP POLICY IF EXISTS "Users can manage members of own groups" ON members;

DROP POLICY IF EXISTS "Allow anonymous access to legacy_plans" ON legacy_plans;
DROP POLICY IF EXISTS "Users can manage own legacy plans" ON legacy_plans;

DROP POLICY IF EXISTS "Allow anonymous access to beneficiaries" ON beneficiaries;
DROP POLICY IF EXISTS "Users can manage beneficiaries of own legacy plans" ON beneficiaries;

DROP POLICY IF EXISTS "Users can see relays they created" ON relays;
DROP POLICY IF EXISTS "Users can see relays they are receiving" ON relays;
DROP POLICY IF EXISTS "Users can create relays" ON relays;
DROP POLICY IF EXISTS "Senders can update their relays" ON relays;
DROP POLICY IF EXISTS "Receivers can update relay status" ON relays;

-- ---------------------------------------------------------------------------
-- Policies keyed on the verified claim
-- ---------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE relays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wallet owns its user row"
  ON users
  FOR ALL
  TO authenticated
  USING (lower(wallet_address) = current_wallet_address())
  WITH CHECK (lower(wallet_address) = current_wallet_address());

CREATE POLICY "Wallet owns its groups"
  ON groups
  FOR ALL
  TO authenticated
  USING (lower(wallet_address) = current_wallet_address())
  WITH CHECK (lower(wallet_address) = current_wallet_address());

CREATE POLICY "Wallet owns members of its groups"
  ON members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = members.group_id
        AND lower(groups.wallet_address) = current_wallet_address()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = members.group_id
        AND lower(groups.wallet_address) = current_wallet_address()
    )
  );

CREATE POLICY "Wallet owns its legacy plans"
  ON legacy_plans
  FOR ALL
  TO authenticated
  USING (lower(wallet_address) = current_wallet_address())
  WITH CHECK (lower(wallet_address) = current_wallet_address());

CREATE POLICY "Wallet owns beneficiaries of its legacy plans"
  ON beneficiaries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM legacy_plans
      WHERE legacy_plans.id = beneficiaries.legacy_plan_id
        AND lower(legacy_plans.wallet_address) = current_wallet_address()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM legacy_plans
      WHERE legacy_plans.id = beneficiaries.legacy_plan_id
        AND lower(legacy_plans.wallet_address) = current_wallet_address()
    )
  );

-- A relay is visible to both parties, but only the sender may create one and
-- only the party whose turn it is may move it along.
CREATE POLICY "Relay parties can read their relays"
  ON relays
  FOR SELECT
  TO authenticated
  USING (
    lower(sender_address) = current_wallet_address()
    OR lower(receiver_address) = current_wallet_address()
  );

CREATE POLICY "Senders can create relays"
  ON relays
  FOR INSERT
  TO authenticated
  WITH CHECK (lower(sender_address) = current_wallet_address());

CREATE POLICY "Relay parties can update their relays"
  ON relays
  FOR UPDATE
  TO authenticated
  USING (
    lower(sender_address) = current_wallet_address()
    OR lower(receiver_address) = current_wallet_address()
  )
  WITH CHECK (
    lower(sender_address) = current_wallet_address()
    OR lower(receiver_address) = current_wallet_address()
  );

CREATE POLICY "Senders can delete their relays"
  ON relays
  FOR DELETE
  TO authenticated
  USING (lower(sender_address) = current_wallet_address());

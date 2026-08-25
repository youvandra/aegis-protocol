-- Aegis Protocol schema.
--
-- Replaces the Supabase/Postgres schema and its RLS policies. Ownership is no
-- longer expressed as database policy: every route checks the session's wallet
-- against the row it touches, which is both easier to read and easier to test.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

-- Sign-in challenges. Rows are deleted the moment they are consumed.
CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce       TEXT PRIMARY KEY,
  evm_address TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_nonces_expires_at ON auth_nonces (expires_at);

-- Opaque session tokens. Held server-side so a session can be revoked, which a
-- self-contained JWT cannot be.
CREATE TABLE IF NOT EXISTS sessions (
  token          TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  evm_address    TEXT NOT NULL,
  expires_at     TEXT NOT NULL,
  created_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  wallet_address     TEXT NOT NULL UNIQUE,
  chain_id           INTEGER,
  first_connected_at TEXT NOT NULL,
  last_connected_at  TEXT NOT NULL,
  connection_count   INTEGER NOT NULL DEFAULT 1,
  is_active          INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users (wallet_address);

CREATE TABLE IF NOT EXISTS groups (
  id             TEXT PRIMARY KEY,
  group_number   TEXT NOT NULL,
  group_name     TEXT NOT NULL,
  release_date   TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  total_members  INTEGER NOT NULL DEFAULT 0,
  total_amount   REAL NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'released')),
  scheduled      INTEGER NOT NULL DEFAULT 0,
  topic_id       TEXT,
  txid           TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_groups_wallet_address ON groups (wallet_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_owner_number
  ON groups (wallet_address, group_number);

CREATE TABLE IF NOT EXISTS members (
  id             TEXT PRIMARY KEY,
  group_id       TEXT NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  amount         REAL NOT NULL CHECK (amount > 0),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_members_group_id ON members (group_id);

CREATE TABLE IF NOT EXISTS relays (
  id               TEXT PRIMARY KEY,
  relay_number     TEXT NOT NULL,
  sender_address   TEXT NOT NULL,
  receiver_address TEXT NOT NULL,
  amount           REAL NOT NULL CHECK (amount > 0),
  status           TEXT NOT NULL CHECK (status IN (
                     'Waiting for Receiver''s Approval',
                     'Waiting for Sender to Execute',
                     'Complete',
                     'Rejected',
                     'Expired'
                   )),
  transaction_hash TEXT,
  topic_id         TEXT,
  expires_at       TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_relays_sender ON relays (sender_address);
CREATE INDEX IF NOT EXISTS idx_relays_receiver ON relays (receiver_address);
CREATE INDEX IF NOT EXISTS idx_relays_expires_at ON relays (expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_relays_sender_number
  ON relays (sender_address, relay_number);

CREATE TABLE IF NOT EXISTS legacy_plans (
  id             TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  moment_type    TEXT NOT NULL CHECK (moment_type IN ('specificDate', 'ifImGone')),
  moment_value   TEXT NOT NULL,
  moment_label   TEXT NOT NULL,
  is_active      INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legacy_plans_wallet_address
  ON legacy_plans (wallet_address);

-- One active plan per wallet; the previous schema allowed duplicates and the
-- client silently picked whichever row came back first.
CREATE UNIQUE INDEX IF NOT EXISTS idx_legacy_plans_one_active
  ON legacy_plans (wallet_address) WHERE is_active = 1;

CREATE TABLE IF NOT EXISTS beneficiaries (
  id              TEXT PRIMARY KEY,
  legacy_plan_id  TEXT NOT NULL REFERENCES legacy_plans (id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  wallet_address  TEXT NOT NULL,
  percentage      REAL NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_plan ON beneficiaries (legacy_plan_id);

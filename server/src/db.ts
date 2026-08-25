import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const here = dirname(fileURLToPath(import.meta.url));

mkdirSync(dirname(env.databasePath), { recursive: true });

/**
 * SQLite via Node's built-in driver.
 *
 * Deliberately not `better-sqlite3`: that needs a native build, and a prebuilt
 * binary that matches the runtime is not always available. `node:sqlite` ships
 * with Node itself, so the install is the same everywhere and there is no
 * compiler in the deployment path. Requires Node 22.5+ (24+ recommended).
 */
export const db = new DatabaseSync(env.databasePath);

// The schema is written to be re-runnable, so applying it on every boot keeps a
// fresh deployment and an existing database on the same footing.
db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));

/**
 * Typed query helpers.
 *
 * `node:sqlite` returns `Record<string, SQLOutputValue>`, which does not
 * overlap with our row interfaces, so every call site would otherwise need a
 * double cast. Centralising that here keeps the routes readable.
 */
export const queryAll = <T>(sql: string, ...params: unknown[]): T[] =>
  db.prepare(sql).all(...(params as never[])) as unknown as T[];

export const queryOne = <T>(sql: string, ...params: unknown[]): T | undefined =>
  db.prepare(sql).get(...(params as never[])) as unknown as T | undefined;

/** Run a statement and report how many rows it changed. */
export const execute = (sql: string, ...params: unknown[]): number =>
  Number(db.prepare(sql).run(...(params as never[])).changes);

export const nowIso = () => new Date().toISOString();

export const newId = () => crypto.randomUUID();

/** Run `work` inside a transaction, rolling back if it throws. */
export const transaction = <T>(work: () => T): T => {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

/**
 * Allocate a 6-digit display number unique among `column` for one owner.
 *
 * Mirrors the Postgres trigger this replaces, including its fallback: after
 * enough collisions, fall back to a timestamp so an insert never spins.
 */
export const allocateNumber = (
  table: 'groups' | 'relays',
  numberColumn: 'group_number' | 'relay_number',
  ownerColumn: 'wallet_address' | 'sender_address',
  owner: string
): string => {
  const sql = `SELECT 1 FROM ${table} WHERE ${numberColumn} = ? AND ${ownerColumn} = ? LIMIT 1`;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = String(100000 + Math.floor(Math.random() * 900000));
    if (!queryOne(sql, candidate, owner)) {
      return candidate;
    }
  }

  return String(Date.now());
};

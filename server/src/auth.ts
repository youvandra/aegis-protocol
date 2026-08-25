import { randomBytes } from 'node:crypto';
import type { Context, Next } from 'hono';
import { verifyMessage } from 'viem';
import { db, newId, nowIso } from './db.js';
import { env } from './env.js';
import { resolveHederaAccountId } from './hedera.js';

export interface Session {
  /** Hedera account ID (`0.0.x`) — the identity every row is keyed on. */
  walletAddress: string;
  evmAddress: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    session: Session;
  }
}

export const isEvmAddress = (value: unknown): value is `0x${string}` =>
  typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);

const buildMessage = (address: string, nonce: string) =>
  [
    'Aegis Protocol wants you to sign in with your wallet.',
    '',
    `Address: ${address}`,
    `Nonce: ${nonce}`,
  ].join('\n');

/** Issue a single-use challenge for the given address. */
export const createNonce = (evmAddress: string) => {
  const nonce = newId();

  db.prepare(
    `INSERT INTO auth_nonces (nonce, evm_address, expires_at, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(
    nonce,
    evmAddress,
    new Date(Date.now() + env.nonceTtlSeconds * 1000).toISOString(),
    nowIso()
  );

  return { nonce, message: buildMessage(evmAddress, nonce) };
};

/**
 * Verify a signature over a challenge and open a session.
 *
 * The nonce is deleted before the signature is checked, so a captured request
 * cannot be replayed even if the attacker wins the race.
 */
export const verifySignature = async (
  evmAddress: `0x${string}`,
  nonce: string,
  signature: `0x${string}`
) => {
  const consumed = db
    .prepare(
      `DELETE FROM auth_nonces
       WHERE nonce = ? AND evm_address = ? AND expires_at > ?
       RETURNING nonce`
    )
    .get(nonce, evmAddress, nowIso());

  if (!consumed) {
    throw new Error('This sign-in challenge is unknown or expired.');
  }

  const valid = await verifyMessage({
    address: evmAddress,
    message: buildMessage(evmAddress, nonce),
    signature,
  });

  if (!valid) {
    throw new Error('Signature does not match the address.');
  }

  // Resolved here rather than taken from the request: the client must not get
  // to choose which account its session speaks for.
  const walletAddress = await resolveHederaAccountId(evmAddress);

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.sessionTtlSeconds * 1000);

  db.prepare(
    `INSERT INTO sessions (token, wallet_address, evm_address, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(token, walletAddress, evmAddress, expiresAt.toISOString(), nowIso());

  return {
    token,
    walletAddress,
    expiresAt: Math.floor(expiresAt.getTime() / 1000),
  };
};

export const revokeSession = (token: string) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
};

/** Delete expired nonces and sessions. */
export const purgeExpired = () => {
  const now = nowIso();
  db.prepare('DELETE FROM auth_nonces WHERE expires_at < ?').run(now);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
};

/**
 * Require a valid session.
 *
 * Replaces the Postgres RLS layer: routes read `c.get('session')` and compare
 * it against the row they are about to touch.
 */
export const requireSession = async (c: Context, next: Next) => {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return c.json({ error: 'Authentication required.' }, 401);
  }

  const row = db
    .prepare(
      `SELECT wallet_address, evm_address FROM sessions
       WHERE token = ? AND expires_at > ?`
    )
    .get(token, nowIso()) as { wallet_address: string; evm_address: string } | undefined;

  if (!row) {
    return c.json({ error: 'Session is invalid or expired.' }, 401);
  }

  c.set('session', { walletAddress: row.wallet_address, evmAddress: row.evm_address });

  await next();
};

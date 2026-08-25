import { Hono } from 'hono';
import { z } from 'zod';
import { requireSession } from '../auth.js';
import { execute, nowIso, newId, queryOne } from '../db.js';

interface UserRow {
  id: string;
  wallet_address: string;
  chain_id: number | null;
  first_connected_at: string;
  last_connected_at: string;
  connection_count: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const toUser = (row: UserRow) => ({ ...row, is_active: row.is_active === 1 });

const connectBody = z.object({ chainId: z.number().int().optional() });

export const userRoutes = new Hono()
  .use('*', requireSession)
  // Record a connection for the signed-in wallet. The wallet comes from the
  // session, never from the request body.
  .post('/me/connect', async (c) => {
    const { walletAddress } = c.get('session');
    const parsed = connectBody.safeParse(await c.req.json().catch(() => ({})));
    const chainId = parsed.success ? parsed.data.chainId : undefined;
    const now = nowIso();

    const existing = queryOne<UserRow>(
      'SELECT * FROM users WHERE wallet_address = ?',
      walletAddress
    );

    if (existing) {
      execute(
        `UPDATE users
         SET last_connected_at = ?, connection_count = connection_count + 1,
             chain_id = ?, is_active = 1, updated_at = ?
         WHERE wallet_address = ?`,
        now,
        chainId ?? existing.chain_id,
        now,
        walletAddress
      );
    } else {
      execute(
        `INSERT INTO users (
           id, wallet_address, chain_id, first_connected_at, last_connected_at,
           connection_count, is_active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)`,
        newId(),
        walletAddress,
        chainId ?? null,
        now,
        now,
        now,
        now
      );
    }

    const user = queryOne<UserRow>(
      'SELECT * FROM users WHERE wallet_address = ?',
      walletAddress
    )!;

    return c.json(toUser(user));
  })
  .get('/me', (c) => {
    const { walletAddress } = c.get('session');

    const user = queryOne<UserRow>(
      'SELECT * FROM users WHERE wallet_address = ?',
      walletAddress
    );

    return user ? c.json(toUser(user)) : c.json(null);
  })
  .post('/me/disconnect', (c) => {
    const { walletAddress } = c.get('session');

    execute(
      'UPDATE users SET is_active = 0, updated_at = ? WHERE wallet_address = ?',
      nowIso(),
      walletAddress
    );

    return c.json({ ok: true });
  });

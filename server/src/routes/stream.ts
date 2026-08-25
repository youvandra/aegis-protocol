import { Hono } from 'hono';
import { z } from 'zod';
import { requireSession } from '../auth.js';
import { allocateNumber, execute, newId, nowIso, queryAll, queryOne, transaction } from '../db.js';

interface GroupRow {
  id: string;
  group_number: string;
  group_name: string;
  release_date: string;
  wallet_address: string;
  total_members: number;
  total_amount: number;
  status: 'upcoming' | 'released';
  scheduled: number;
  topic_id: string | null;
  txid: string | null;
  created_at: string;
  updated_at: string;
}

interface MemberRow {
  id: string;
  group_id: string;
  name: string;
  wallet_address: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

const shapeGroup = (row: GroupRow) => ({
  ...row,
  // `number` is what the table components render; the column is `group_number`.
  number: row.group_number,
  scheduled: row.scheduled === 1,
  members: queryAll<MemberRow>(
    'SELECT * FROM members WHERE group_id = ? ORDER BY created_at ASC',
    row.id
  ),
});

/** Keep the denormalised totals in step with the member rows. */
const refreshTotals = (groupId: string, at: string) =>
  execute(
    `UPDATE groups
     SET total_members = (SELECT COUNT(*) FROM members WHERE group_id = groups.id),
         total_amount  = (SELECT COALESCE(SUM(amount), 0) FROM members WHERE group_id = groups.id),
         updated_at    = ?
     WHERE id = ?`,
    at,
    groupId
  );

const createBody = z.object({
  groupName: z.string().min(1),
  releaseDateTime: z.string().min(1),
  topicId: z.string().min(1),
  txid: z.string().min(1),
});

const memberBody = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  amount: z.number().positive(),
});

/** Load a group only if the session owns it. */
const ownedGroup = (id: string, walletAddress: string) =>
  queryOne<GroupRow>(
    'SELECT * FROM groups WHERE id = ? AND wallet_address = ?',
    id,
    walletAddress
  );

export const streamRoutes = new Hono()
  .use('*', requireSession)
  .get('/', (c) => {
    const { walletAddress } = c.get('session');

    const rows = queryAll<GroupRow>(
      'SELECT * FROM groups WHERE wallet_address = ? ORDER BY created_at DESC',
      walletAddress
    );

    return c.json(rows.map(shapeGroup));
  })
  .post('/', async (c) => {
    const { walletAddress } = c.get('session');
    const parsed = createBody.safeParse(await c.req.json().catch(() => null));

    if (!parsed.success) {
      return c.json({ error: 'groupName, releaseDateTime, topicId and txid are required.' }, 400);
    }

    const { groupName, releaseDateTime, topicId, txid } = parsed.data;
    const now = nowIso();
    const id = newId();

    execute(
      `INSERT INTO groups (
         id, group_number, group_name, release_date, wallet_address,
         total_members, total_amount, status, scheduled, topic_id, txid,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 0, 0, 'upcoming', 0, ?, ?, ?, ?)`,
      id,
      allocateNumber('groups', 'group_number', 'wallet_address', walletAddress),
      groupName,
      releaseDateTime,
      walletAddress,
      topicId,
      txid,
      now,
      now
    );

    return c.json(shapeGroup(ownedGroup(id, walletAddress)!), 201);
  })
  .post('/:id/members', async (c) => {
    const { walletAddress } = c.get('session');
    const group = ownedGroup(c.req.param('id'), walletAddress);

    if (!group) {
      return c.json({ error: 'Group not found.' }, 404);
    }

    if (group.scheduled === 1 || group.status === 'released') {
      return c.json({ error: 'This group can no longer be changed.' }, 409);
    }

    const parsed = memberBody.safeParse(await c.req.json().catch(() => null));

    if (!parsed.success) {
      return c.json({ error: 'name, address and a positive amount are required.' }, 400);
    }

    const { name, address, amount } = parsed.data;
    const now = nowIso();
    const id = newId();

    transaction(() => {
      execute(
        `INSERT INTO members (id, group_id, name, wallet_address, amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        group.id,
        name,
        address.toLowerCase(),
        amount,
        now,
        now
      );

      refreshTotals(group.id, now);
    });

    return c.json(
      queryOne<MemberRow>('SELECT * FROM members WHERE id = ?', id)!,
      201
    );
  })
  .delete('/:id/members/:memberId', (c) => {
    const { walletAddress } = c.get('session');
    const group = ownedGroup(c.req.param('id'), walletAddress);

    if (!group) {
      return c.json({ error: 'Group not found.' }, 404);
    }

    const now = nowIso();

    const removed = transaction(() => {
      const changes = execute(
        'DELETE FROM members WHERE id = ? AND group_id = ?',
        c.req.param('memberId'),
        group.id
      );

      refreshTotals(group.id, now);
      return changes > 0;
    });

    return removed ? c.json({ ok: true }) : c.json({ error: 'Member not found.' }, 404);
  })
  // Marks the group as funded. The deposit itself is a wallet-signed transfer
  // the client makes before calling this.
  .post('/:id/schedule', (c) => {
    const { walletAddress } = c.get('session');
    const group = ownedGroup(c.req.param('id'), walletAddress);

    if (!group) {
      return c.json({ error: 'Group not found.' }, 404);
    }

    if (group.total_members === 0) {
      return c.json({ error: 'Add at least one member before scheduling.' }, 409);
    }

    execute(
      'UPDATE groups SET scheduled = 1, updated_at = ? WHERE id = ?',
      nowIso(),
      group.id
    );

    return c.json(shapeGroup(ownedGroup(group.id, walletAddress)!));
  })
  .post('/:id/release', (c) => {
    const { walletAddress } = c.get('session');
    const group = ownedGroup(c.req.param('id'), walletAddress);

    if (!group) {
      return c.json({ error: 'Group not found.' }, 404);
    }

    if (group.status !== 'upcoming') {
      return c.json({ error: 'Only an upcoming group can be released.' }, 409);
    }

    const now = nowIso();
    execute(
      `UPDATE groups SET status = 'released', release_date = ?, updated_at = ? WHERE id = ?`,
      now,
      now,
      group.id
    );

    return c.json(shapeGroup(ownedGroup(group.id, walletAddress)!));
  })
  .delete('/:id', (c) => {
    const { walletAddress } = c.get('session');

    const changes = execute(
      'DELETE FROM groups WHERE id = ? AND wallet_address = ?',
      c.req.param('id'),
      walletAddress
    );

    return changes > 0
      ? c.json({ ok: true })
      : c.json({ error: 'Group not found.' }, 404);
  });

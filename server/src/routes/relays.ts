import { Hono } from 'hono';
import { z } from 'zod';
import { requireSession } from '../auth.js';
import { allocateNumber, execute, newId, nowIso, queryAll, queryOne } from '../db.js';

interface RelayRow {
  id: string;
  relay_number: string;
  sender_address: string;
  receiver_address: string;
  amount: number;
  status:
    | "Waiting for Receiver's Approval"
    | 'Waiting for Sender to Execute'
    | 'Complete'
    | 'Rejected'
    | 'Expired';
  transaction_hash: string | null;
  topic_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Move past-due relays to Expired. Cheap enough to run before every read. */
export const expireOldRelays = () => {
  const now = nowIso();
  execute(
    `UPDATE relays
     SET status = 'Expired', updated_at = ?
     WHERE expires_at IS NOT NULL
       AND expires_at < ?
       AND status NOT IN ('Complete', 'Rejected', 'Expired')`,
    now,
    now
  );
};

const createBody = z.object({
  receiverAddress: z.string().min(1),
  amount: z.number().positive(),
  expiresAt: z.string().optional(),
  topicId: z.string().optional(),
});

const actionBody = z.object({
  transactionHash: z.string().optional(),
});

const findRelay = (id: string) =>
  queryOne<RelayRow>('SELECT * FROM relays WHERE id = ?', id);

const setStatus = (id: string, status: RelayRow['status'], transactionHash?: string) => {
  execute(
    `UPDATE relays SET status = ?, transaction_hash = COALESCE(?, transaction_hash), updated_at = ?
     WHERE id = ?`,
    status,
    transactionHash ?? null,
    nowIso(),
    id
  );

  return findRelay(id)!;
};

export const relayRoutes = new Hono()
  .use('*', requireSession)
  .get('/', (c) => {
    const { walletAddress } = c.get('session');
    expireOldRelays();

    const rows = queryAll<RelayRow>(
      `SELECT * FROM relays
       WHERE sender_address = ? OR receiver_address = ?
       ORDER BY created_at DESC`,
      walletAddress,
      walletAddress
    );

    return c.json(rows);
  })
  .post('/', async (c) => {
    const { walletAddress } = c.get('session');
    const parsed = createBody.safeParse(await c.req.json().catch(() => null));

    if (!parsed.success) {
      return c.json({ error: 'receiverAddress and a positive amount are required.' }, 400);
    }

    const { receiverAddress, amount, expiresAt, topicId } = parsed.data;
    const receiver = receiverAddress.toLowerCase();

    if (receiver === walletAddress.toLowerCase()) {
      return c.json({ error: 'A relay needs a different receiver.' }, 400);
    }

    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
      return c.json({ error: 'Expiration must be in the future.' }, 400);
    }

    const id = newId();
    const now = nowIso();

    execute(
      `INSERT INTO relays (
         id, relay_number, sender_address, receiver_address, amount, status,
         transaction_hash, topic_id, expires_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'Waiting for Receiver''s Approval', NULL, ?, ?, ?, ?)`,
      id,
      allocateNumber('relays', 'relay_number', 'sender_address', walletAddress),
      walletAddress,
      receiver,
      amount,
      topicId ?? null,
      expiresAt ?? null,
      now,
      now
    );

    return c.json(findRelay(id)!, 201);
  })
  // Each transition names who may make it and from which state, so a party
  // cannot skip a step by calling the endpoint out of order.
  .post('/:id/approve', (c) => {
    const { walletAddress } = c.get('session');
    const relay = findRelay(c.req.param('id'));

    if (!relay || relay.receiver_address !== walletAddress) {
      return c.json({ error: 'Relay not found.' }, 404);
    }

    if (relay.status !== "Waiting for Receiver's Approval") {
      return c.json({ error: 'This relay is not awaiting your approval.' }, 409);
    }

    return c.json(setStatus(relay.id, 'Waiting for Sender to Execute'));
  })
  .post('/:id/reject', (c) => {
    const { walletAddress } = c.get('session');
    const relay = findRelay(c.req.param('id'));

    if (!relay || relay.receiver_address !== walletAddress) {
      return c.json({ error: 'Relay not found.' }, 404);
    }

    if (relay.status !== "Waiting for Receiver's Approval") {
      return c.json({ error: 'This relay is not awaiting your approval.' }, 409);
    }

    return c.json(setStatus(relay.id, 'Rejected'));
  })
  .post('/:id/execute', async (c) => {
    const { walletAddress } = c.get('session');
    const relay = findRelay(c.req.param('id'));

    if (!relay || relay.sender_address !== walletAddress) {
      return c.json({ error: 'Relay not found.' }, 404);
    }

    if (relay.status !== 'Waiting for Sender to Execute') {
      return c.json({ error: 'This relay is not ready to be executed.' }, 409);
    }

    const parsed = actionBody.safeParse(await c.req.json().catch(() => ({})));
    const transactionHash = parsed.success ? parsed.data.transactionHash : undefined;

    if (!transactionHash) {
      return c.json({ error: 'A transaction hash is required.' }, 400);
    }

    return c.json(setStatus(relay.id, 'Complete', transactionHash));
  })
  .post('/:id/cancel', (c) => {
    const { walletAddress } = c.get('session');
    const relay = findRelay(c.req.param('id'));

    if (!relay || relay.sender_address !== walletAddress) {
      return c.json({ error: 'Relay not found.' }, 404);
    }

    if (relay.status === 'Complete' || relay.status === 'Rejected') {
      return c.json({ error: 'This relay is already closed.' }, 409);
    }

    return c.json(setStatus(relay.id, 'Rejected'));
  });

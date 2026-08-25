import { Hono } from 'hono';
import { z } from 'zod';
import { requireSession } from '../auth.js';
import { MAX_MESSAGE_BYTES, createTopic, resolveEvmAddress, submitMessage } from '../hedera.js';

const topicBody = z.object({
  memo: z.string().default(''),
  transactionMemo: z.string().optional(),
});

const messageBody = z.object({
  topicId: z.string().min(1),
  message: z.string().min(1),
});

// Every write here spends the operator's HBAR, so a valid session is required.
export const hcsRoutes = new Hono()
  .use('*', requireSession)
  .post('/topics', async (c) => {
    const parsed = topicBody.safeParse(await c.req.json().catch(() => ({})));

    if (!parsed.success) {
      return c.json({ error: 'Invalid topic request.' }, 400);
    }

    try {
      return c.json(
        await createTopic(parsed.data.memo, parsed.data.transactionMemo)
      );
    } catch (error) {
      console.error('Topic creation failed:', error);
      return c.json({ error: 'Consensus service request failed.' }, 502);
    }
  })
  .post('/messages', async (c) => {
    const parsed = messageBody.safeParse(await c.req.json().catch(() => null));

    if (!parsed.success) {
      return c.json({ error: '"topicId" and "message" are required.' }, 400);
    }

    if (Buffer.byteLength(parsed.data.message, 'utf8') > MAX_MESSAGE_BYTES) {
      return c.json({ error: 'Message is too large.' }, 413);
    }

    try {
      return c.json(await submitMessage(parsed.data.topicId, parsed.data.message));
    } catch (error) {
      console.error('Message submission failed:', error);
      return c.json({ error: 'Consensus service request failed.' }, 502);
    }
  })
  // Mirror node lookups are public data, but proxying them keeps the client
  // free of network configuration.
  .get('/accounts/:id/evm-address', async (c) => {
    try {
      return c.json({ evmAddress: await resolveEvmAddress(c.req.param('id')) });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Account lookup failed.' },
        404
      );
    }
  });

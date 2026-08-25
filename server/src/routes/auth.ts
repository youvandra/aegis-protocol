import { Hono } from 'hono';
import { z } from 'zod';
import { createNonce, isEvmAddress, revokeSession, verifySignature } from '../auth.js';

const addressSchema = z
  .string()
  .refine(isEvmAddress, 'A valid EVM address is required.')
  .transform((value) => value.toLowerCase() as `0x${string}`);

const nonceBody = z.object({ address: addressSchema });

const verifyBody = z.object({
  address: addressSchema,
  nonce: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/) as z.ZodType<`0x${string}`>,
});

export const authRoutes = new Hono()
  .post('/nonce', async (c) => {
    const parsed = nonceBody.safeParse(await c.req.json().catch(() => null));

    if (!parsed.success) {
      return c.json({ error: 'A valid EVM address is required.' }, 400);
    }

    return c.json(createNonce(parsed.data.address));
  })
  .post('/verify', async (c) => {
    const parsed = verifyBody.safeParse(await c.req.json().catch(() => null));

    if (!parsed.success) {
      return c.json({ error: 'address, nonce and signature are required.' }, 400);
    }

    const { address, nonce, signature } = parsed.data;

    try {
      return c.json(await verifySignature(address, nonce, signature));
    } catch (error) {
      console.error('Sign-in failed:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Sign-in failed.' },
        401
      );
    }
  })
  .post('/sign-out', (c) => {
    const header = c.req.header('Authorization');
    if (header?.startsWith('Bearer ')) {
      revokeSession(header.slice(7));
    }
    return c.json({ ok: true });
  });

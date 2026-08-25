// Wallet authentication.
//
// Every RLS policy in this project scopes rows by the caller's Hedera account
// ID. Before this function existed the client simply asserted that ID in an
// `X-Wallet-Address` header, which anyone could forge with curl. Here the
// caller must prove control of the key by signing a single-use nonce; only then
// do they get a short-lived JWT carrying the account ID as a verified claim.
//
// Required function secrets (all present by default except the last two):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
//   HEDERA_MIRROR_NODE_URL  optional, defaults to testnet
//   ALLOWED_ORIGIN          optional CORS origin

import { createClient } from 'npm:@supabase/supabase-js@2.53.0';
import { verifyMessage } from 'npm:viem@2.33.3';
import { SignJWT } from 'npm:jose@5.9.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const MIRROR_NODE_URL =
  Deno.env.get('HEDERA_MIRROR_NODE_URL') ?? 'https://testnet.mirrornode.hedera.com';

const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_SECONDS = 60 * 60;

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

const isEvmAddress = (value: unknown): value is `0x${string}` =>
  typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);

const buildMessage = (address: string, nonce: string) =>
  [
    'Aegis Protocol wants you to sign in with your wallet.',
    '',
    `Address: ${address}`,
    `Nonce: ${nonce}`,
  ].join('\n');

/** Resolve EVM address to Hedera account ID server-side; never trust the client's. */
const resolveHederaAccountId = async (evmAddress: string): Promise<string> => {
  const response = await fetch(
    `${MIRROR_NODE_URL}/api/v1/accounts/${encodeURIComponent(evmAddress)}?limit=1&order=desc`
  );

  if (!response.ok) {
    throw new Error(`Mirror node returned ${response.status} for ${evmAddress}.`);
  }

  const account = await response.json();
  if (!account?.account) {
    throw new Error(`No Hedera account for ${evmAddress}.`);
  }

  return account.account as string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  try {
    const body = await request.json();
    const address = typeof body?.address === 'string' ? body.address.toLowerCase() : null;

    if (!isEvmAddress(address)) {
      return json({ error: 'A valid EVM address is required.' }, 400);
    }

    if (body?.action === 'nonce') {
      const nonce = crypto.randomUUID();

      const { error } = await admin.from('auth_nonces').insert({
        nonce,
        evm_address: address,
        expires_at: new Date(Date.now() + NONCE_TTL_MS).toISOString(),
      });

      if (error) {
        console.error('Failed to store nonce:', error);
        return json({ error: 'Could not start a sign-in challenge.' }, 500);
      }

      return json({ nonce, message: buildMessage(address, nonce) });
    }

    if (body?.action === 'verify') {
      const { nonce, signature } = body;

      if (typeof nonce !== 'string' || typeof signature !== 'string') {
        return json({ error: '"nonce" and "signature" are required.' }, 400);
      }

      // Consuming the nonce in the same statement that reads it makes each
      // challenge strictly single-use, even under concurrent requests.
      const { data: consumed, error: consumeError } = await admin
        .from('auth_nonces')
        .delete()
        .eq('nonce', nonce)
        .eq('evm_address', address)
        .gt('expires_at', new Date().toISOString())
        .select()
        .maybeSingle();

      if (consumeError) {
        console.error('Failed to consume nonce:', consumeError);
        return json({ error: 'Sign-in failed.' }, 500);
      }

      if (!consumed) {
        return json({ error: 'This sign-in challenge is unknown or expired.' }, 401);
      }

      const valid = await verifyMessage({
        address,
        message: buildMessage(address, nonce),
        signature: signature as `0x${string}`,
      });

      if (!valid) {
        return json({ error: 'Signature does not match the address.' }, 401);
      }

      const hederaAccountId = await resolveHederaAccountId(address);

      const secret = new TextEncoder().encode(Deno.env.get('SUPABASE_JWT_SECRET')!);
      const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

      const token = await new SignJWT({
        role: 'authenticated',
        wallet_address: hederaAccountId,
        evm_address: address,
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setSubject(hederaAccountId)
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(secret);

      return json({ token, expiresAt, walletAddress: hederaAccountId });
    }

    return json({ error: `Unknown action "${body?.action}".` }, 400);
  } catch (error) {
    console.error('Wallet auth failed:', error);
    return json({ error: 'Sign-in failed.' }, 500);
  }
});

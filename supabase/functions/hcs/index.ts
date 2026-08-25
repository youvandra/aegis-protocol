// Hedera Consensus Service gateway.
//
// The operator key pays for every topic created and every message submitted, so
// it must never reach the browser bundle. This function is the only place that
// holds it; the client calls it over HTTPS and never sees the key.
//
// Required function secrets:
//   HEDERA_ACCOUNT_ID   e.g. 0.0.12345
//   HEDERA_PRIVATE_KEY  ECDSA operator key
//   HEDERA_NETWORK      "testnet" (default) or "mainnet"

import {
  AccountId,
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicId,
  TopicMessageSubmitTransaction,
} from 'npm:@hashgraph/sdk@2.70.0';

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

const buildClient = () => {
  const accountId = Deno.env.get('HEDERA_ACCOUNT_ID');
  const privateKey = Deno.env.get('HEDERA_PRIVATE_KEY');

  if (!accountId || !privateKey) {
    throw new Error('HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set.');
  }

  const client =
    Deno.env.get('HEDERA_NETWORK') === 'mainnet'
      ? Client.forMainnet()
      : Client.forTestnet();

  return client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromStringECDSA(privateKey)
  );
};

// A single message must fit in one HCS transaction comfortably.
const MAX_MESSAGE_BYTES = 4096;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  let client: Client;
  try {
    client = buildClient();
  } catch (error) {
    console.error('HCS operator misconfigured:', error);
    return json({ error: 'Consensus service is not configured.' }, 500);
  }

  try {
    const body = await request.json();

    switch (body?.action) {
      case 'createTopic': {
        const transaction = new TopicCreateTransaction().setTopicMemo(
          typeof body.memo === 'string' ? body.memo.slice(0, 100) : ''
        );

        if (typeof body.transactionMemo === 'string') {
          transaction.setTransactionMemo(body.transactionMemo.slice(0, 100));
        }

        const response = await transaction.execute(client);
        const receipt = await response.getReceipt(client);

        const topicId = receipt.topicId?.toString();
        if (!topicId) {
          return json({ error: 'Topic creation returned no topic ID.' }, 502);
        }

        return json({ topicId, transactionId: response.transactionId.toString() });
      }

      case 'submitMessage': {
        if (typeof body.topicId !== 'string' || typeof body.message !== 'string') {
          return json({ error: '"topicId" and "message" are required.' }, 400);
        }

        if (new TextEncoder().encode(body.message).length > MAX_MESSAGE_BYTES) {
          return json({ error: 'Message is too large.' }, 413);
        }

        const response = await new TopicMessageSubmitTransaction()
          .setTopicId(TopicId.fromString(body.topicId))
          .setMessage(body.message)
          .execute(client);
        const receipt = await response.getReceipt(client);

        return json({
          sequenceNumber: receipt.topicSequenceNumber?.toString() ?? null,
          transactionId: response.transactionId.toString(),
        });
      }

      default:
        return json({ error: `Unknown action "${body?.action}".` }, 400);
    }
  } catch (error) {
    console.error('HCS request failed:', error);
    return json({ error: 'Consensus service request failed.' }, 502);
  } finally {
    client.close();
  }
});

import {
  AccountId,
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicId,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';
import { env } from './env.js';

/**
 * The protocol operator client.
 *
 * This is the only process that ever holds the key. It used to be read from a
 * `VITE_` variable, which Vite inlines into the browser bundle — anyone could
 * read it out of the deployed JavaScript.
 */
const client = (
  env.hedera.network === 'mainnet' ? Client.forMainnet() : Client.forTestnet()
).setOperator(
  AccountId.fromString(env.hedera.accountId),
  PrivateKey.fromStringECDSA(env.hedera.privateKey)
);

interface MirrorAccount {
  account: string;
  evm_address: string;
}

/** Look up an account on the public mirror node. Free, and needs no key. */
export const fetchAccount = async (
  idOrAliasOrEvmAddress: string
): Promise<MirrorAccount> => {
  const response = await fetch(
    `${env.hedera.mirrorNodeUrl}/api/v1/accounts/${encodeURIComponent(
      idOrAliasOrEvmAddress
    )}?limit=1&order=desc`
  );

  if (!response.ok) {
    throw new Error(
      `Hedera account "${idOrAliasOrEvmAddress}" could not be resolved (mirror node returned ${response.status}).`
    );
  }

  const account = (await response.json()) as Partial<MirrorAccount>;

  if (!account?.account || !account?.evm_address) {
    throw new Error(`Hedera account "${idOrAliasOrEvmAddress}" has no usable address.`);
  }

  return account as MirrorAccount;
};

export const resolveHederaAccountId = async (evmAddress: string): Promise<string> =>
  (await fetchAccount(evmAddress)).account;

export const resolveEvmAddress = async (idOrAlias: string): Promise<string> =>
  (await fetchAccount(idOrAlias)).evm_address;

/** A message must fit comfortably in one HCS transaction. */
export const MAX_MESSAGE_BYTES = 4096;

export const createTopic = async (
  memo: string,
  transactionMemo?: string
): Promise<{ topicId: string; transactionId: string }> => {
  const transaction = new TopicCreateTransaction().setTopicMemo(memo.slice(0, 100));

  if (transactionMemo) {
    transaction.setTransactionMemo(transactionMemo.slice(0, 100));
  }

  const response = await transaction.execute(client);
  const receipt = await response.getReceipt(client);

  if (!receipt.topicId) {
    throw new Error('Topic creation returned no topic ID.');
  }

  return {
    topicId: receipt.topicId.toString(),
    transactionId: response.transactionId.toString(),
  };
};

export const submitMessage = async (
  topicId: string,
  message: string
): Promise<{ sequenceNumber: string | null; transactionId: string }> => {
  const response = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(message)
    .execute(client);

  const receipt = await response.getReceipt(client);

  return {
    sequenceNumber: receipt.topicSequenceNumber?.toString() ?? null,
    transactionId: response.transactionId.toString(),
  };
};

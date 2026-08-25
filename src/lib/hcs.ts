import { invokeFunction } from './functions';

/**
 * Client for the `hcs` edge function.
 *
 * Topic creation and message submission are paid Hedera transactions signed by
 * the protocol operator key. That key lives in the edge function's secrets, so
 * the browser only ever sees the resulting topic ID / sequence number.
 */
const invoke = <T>(body: Record<string, unknown>): Promise<T> =>
  invokeFunction<T>('hcs', body);

/** Create an HCS topic and return its ID plus the paying transaction ID. */
export const createTopic = (
  memo: string,
  transactionMemo?: string
): Promise<{ topicId: string; transactionId: string }> =>
  invoke({ action: 'createTopic', memo, transactionMemo });

/** Append a message to an existing HCS topic. */
export const submitMessage = async (topicId: string, message: string): Promise<void> => {
  await invoke({ action: 'submitMessage', topicId, message });
};

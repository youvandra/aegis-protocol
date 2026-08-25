/**
 * Turn a thrown value into something worth showing a user.
 *
 * Handlers used to swallow every failure behind a single generic string, which
 * made a rejected wallet signature indistinguishable from a broken RPC call.
 * Wallet errors carry a `shortMessage`; anything else falls back to the caller's
 * message so raw stack detail never reaches the UI.
 */
export const errorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const { shortMessage, name } = error as { shortMessage?: unknown; name?: unknown };

    if (name === 'UserRejectedRequestError') {
      return 'Transaction rejected in your wallet.';
    }

    if (typeof shortMessage === 'string' && shortMessage.trim()) {
      return shortMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

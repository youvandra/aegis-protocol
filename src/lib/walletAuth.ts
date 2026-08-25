import type { SignMessageMutateAsync } from 'wagmi/query';
import { authApi, setSessionToken } from './api';

/**
 * Prove ownership of the connected wallet and open a session.
 *
 * The server resolves the Hedera account ID from the verified signature, so the
 * client never gets to choose which account its session speaks for.
 */
export const signIn = async (
  address: `0x${string}`,
  signMessageAsync: SignMessageMutateAsync<unknown>
): Promise<string> => {
  const { nonce, message } = await authApi.requestNonce(address);

  const signature = await signMessageAsync({ message });

  const session = await authApi.verifySignature(address, nonce, signature);

  setSessionToken(session.token);

  return session.walletAddress;
};

export const signOut = async () => {
  try {
    await authApi.signOut();
  } catch (error) {
    console.error('Failed to revoke session:', error);
  } finally {
    setSessionToken(null);
  }
};

import type { SignMessageMutateAsync } from 'wagmi/query';
import { setWalletSession, clearWalletSession } from './supabase';
import { invokeFunction } from './functions';

interface NonceResponse {
  nonce: string;
  message: string;
}

interface VerifyResponse {
  token: string;
  expiresAt: number;
  walletAddress: string;
}

const invoke = <T>(body: Record<string, unknown>): Promise<T> =>
  invokeFunction<T>('wallet-auth', body);

/**
 * Prove ownership of the connected wallet and start a scoped session.
 *
 * The returned token is a Supabase-signed JWT whose `wallet_address` claim is
 * resolved server-side from the signature, so RLS can trust it in a way it
 * could never trust a client-set header.
 */
export const signIn = async (
  address: `0x${string}`,
  signMessageAsync: SignMessageMutateAsync<unknown>
): Promise<string> => {
  const { nonce, message } = await invoke<NonceResponse>({ action: 'nonce', address });

  const signature = await signMessageAsync({ message });

  const session = await invoke<VerifyResponse>({
    action: 'verify',
    address,
    nonce,
    signature,
  });

  setWalletSession(session.token, session.walletAddress, session.expiresAt);

  return session.walletAddress;
};

export const signOut = () => {
  clearWalletSession();
};

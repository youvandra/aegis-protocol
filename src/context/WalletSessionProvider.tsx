import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
import { walletAccountService, clearWalletSession } from '../lib/supabase';
import { signIn } from '../lib/walletAuth';
import { WalletSessionContext } from './walletSessionContext';

/**
 * Owns the single wallet session for the app.
 *
 * Sign-in prompts the user for a signature, so it must happen exactly once per
 * connection — hence one provider at the root rather than a hook each component
 * calls independently.
 */
export const WalletSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // The address a session is held (or being obtained) for, so a re-render never
  // triggers a second signature prompt.
  const authenticatedFor = useRef<string | null>(null);

  const authenticate = useCallback(async () => {
    if (!isConnected || !address) return;

    authenticatedFor.current = address;
    setAuthenticating(true);
    setAuthError(null);

    try {
      const resolvedAccountId = await signIn(address, signMessageAsync);

      // The user may have switched accounts mid-flow.
      if (authenticatedFor.current !== address) return;

      setHederaAccountId(resolvedAccountId);

      try {
        await walletAccountService.upsertWalletAccount(resolvedAccountId, chainId);
      } catch (error) {
        console.error('Failed to save user data to Supabase:', error);
      }
    } catch (error) {
      console.error('Wallet sign-in failed:', error);
      authenticatedFor.current = null;
      setHederaAccountId(null);
      clearWalletSession();
      setAuthError(
        error instanceof Error ? error.message : 'Could not sign in with this wallet.'
      );
    } finally {
      setAuthenticating(false);
    }
  }, [isConnected, address, chainId, signMessageAsync]);

  useEffect(() => {
    if (!isConnected || !address) return;
    if (authenticatedFor.current === address) return;

    authenticate();
  }, [isConnected, address, authenticate]);

  // Tear the session down on disconnect.
  useEffect(() => {
    if (isConnected) return;

    const previousAccountId = authenticatedFor.current ? hederaAccountId : null;
    authenticatedFor.current = null;
    setHederaAccountId(null);
    setAuthError(null);

    const markInactive = async () => {
      if (previousAccountId) {
        try {
          await walletAccountService.setUserInactive(previousAccountId);
        } catch (error) {
          console.error('Failed to set user inactive:', error);
        }
      }
      clearWalletSession();
    };

    markInactive();
    // `hederaAccountId` is only read as the last-known value here and is
    // cleared in the same pass, so depending on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <WalletSessionContext.Provider
      value={{
        isConnected,
        hederaAccountId,
        authenticating,
        authError,
        retryAuthentication: authenticate,
      }}
    >
      {children}
    </WalletSessionContext.Provider>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
import { walletAccountService, setSessionToken } from '../lib/api';
import { signIn, signOut } from '../lib/walletAuth';
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
        await walletAccountService.recordConnection(chainId);
      } catch (error) {
        console.error('Failed to record the connection:', error);
      }
    } catch (error) {
      console.error('Wallet sign-in failed:', error);
      authenticatedFor.current = null;
      setHederaAccountId(null);
      setSessionToken(null);
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

    const hadSession = authenticatedFor.current !== null;
    authenticatedFor.current = null;
    setHederaAccountId(null);
    setAuthError(null);

    // Nothing to tear down if this wallet never signed in — on a cold load
    // that would fire a pointless sign-out on every visit.
    if (!hadSession) {
      setSessionToken(null);
      return;
    }

    const tearDown = async () => {
      try {
        await walletAccountService.markInactive();
      } catch (error) {
        console.error('Failed to set user inactive:', error);
      }

      await signOut();
    };

    tearDown();
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

import { createContext } from 'react';

export interface WalletSessionValue {
  isConnected: boolean;
  /** Hedera account ID (`0.0.x`) of the signed-in wallet, if any. */
  hederaAccountId: string | null;
  authenticating: boolean;
  authError: string | null;
  retryAuthentication: () => void;
}

export const WalletSessionContext = createContext<WalletSessionValue | null>(null);

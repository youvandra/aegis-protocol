import { useContext } from 'react';
import {
  WalletSessionContext,
  type WalletSessionValue,
} from '../context/walletSessionContext';

/**
 * Read the app's single wallet session.
 *
 * The work lives in `WalletSessionProvider`; this hook only reads it, so any
 * number of components can call it without triggering extra signature prompts.
 */
export const useWalletTracking = (): WalletSessionValue => {
  const value = useContext(WalletSessionContext);

  if (!value) {
    throw new Error('useWalletTracking must be used inside a WalletSessionProvider.');
  }

  return value;
};

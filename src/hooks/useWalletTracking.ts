import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { walletAccountService } from '../lib/supabase';

export const useWalletTracking = () => {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const trackWalletConnection = async () => {
      if (isConnected && address) {
        try {
          const account = await walletAccountService.upsertWalletAccount(address);
          if (account) {
            console.log('Wallet account tracked:', {
              address: account.wallet_address,
              connectionCount: account.connection_count,
              lastConnected: account.last_connected_at
            });
          }
        } catch (error) {
          console.error('Failed to track wallet connection:', error);
        }
      }
    };

    trackWalletConnection();
  }, [isConnected, address]);

  return {
    isConnected,
    address
  };
};
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { walletAccountService } from '../lib/supabase';

export const useWalletTracking = () => {
  const { address, isConnected } = useAccount();
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  useEffect(() => {
    const trackWalletConnection = async () => {
      if (isConnected && address) {
        setIsTracking(true);
        setTrackingError(null);
        
        try {
          console.log('Wallet connected, tracking:', address);
          
          // Test Supabase connection first
          const connectionTest = await walletAccountService.testConnection();
          if (!connectionTest) {
            throw new Error('Failed to connect to Supabase');
          }
          
          const account = await walletAccountService.upsertWalletAccount(address);
          if (account) {
            console.log('✅ Wallet account successfully tracked:', {
              id: account.id,
              address: account.wallet_address,
              connectionCount: account.connection_count,
              lastConnected: account.last_connected_at
            });
          } else {
            throw new Error('Failed to create/update wallet account');
          }
        } catch (error) {
          console.error('❌ Failed to track wallet connection:', error);
          setTrackingError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
          setIsTracking(false);
        }
      }
    };

    // Only track when wallet becomes connected
    if (isConnected && address) {
      trackWalletConnection();
    }
  }, [isConnected, address]);

  return {
    isConnected,
    address,
    isTracking,
    trackingError
  };
};
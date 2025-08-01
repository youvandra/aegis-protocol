import { useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { walletAccountService, setWalletContext, clearWalletContext } from '../lib/supabase';

export const useWalletTracking = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    const handleWalletConnection = async () => {
      if (isConnected && address) {
        // Set wallet context for all subsequent requests
        setWalletContext(address);
        console.log('Wallet connected:', address);
        
        // Automatically create/update user in Supabase
        try {
          const user = await walletAccountService.upsertWalletAccount(address, chainId);
          if (user) {
            console.log('User data saved to Supabase:', {
              address: user.wallet_address,
              connectionCount: user.connection_count,
              isNewUser: user.connection_count === 1
            });
          }
        } catch (error) {
          console.error('Failed to save user data to Supabase:', error);
        }
      }
    };

    handleWalletConnection();
  }, [isConnected, address, chainId]);

  // Handle wallet disconnection
  useEffect(() => {
    const handleWalletDisconnection = async () => {
      if (!isConnected && address) {
        setWalletContext(address);
        try {
          await walletAccountService.setUserInactive(address);
          console.log('User set to inactive:', address);
        } catch (error) {
          console.error('Failed to set user inactive:', error);
        } finally {
          clearWalletContext();
        }
      } else if (!isConnected) {
        clearWalletContext();
      }
    };

    if (!isConnected) {
      handleWalletDisconnection();
    }
  }, [isConnected, address]);

  return {
    isConnected,
    address
  };
};
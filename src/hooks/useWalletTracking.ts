import { useEffect } from 'react';
import { useAccount } from 'wagmi';

export const useWalletTracking = () => {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      console.log('Wallet connected:', address);
    }
  }, [isConnected, address]);

  return {
    isConnected,
    address
  };
};
import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { walletAccountService, setWalletContext, clearWalletContext } from '../lib/supabase';
import { AccountId, AccountInfoQuery, Client, PrivateKey } from '@hashgraph/sdk';

export const useWalletTracking = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (isConnected && address) {
        const MY_ACCOUNT_ID = AccountId.fromString(import.meta.env.VITE_HEDERA_ACCOUNT_ID!);
            const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
              import.meta.env.VITE_HEDERA_PRIVATE_KEY!
            );
        
            const client = Client.forTestnet().setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
        
            try {
              // Convert EVM → Hedera AccountId instance
              const accountIdFromEvm = AccountId.fromEvmAddress(0, 0, address);
        
              // Query pakai Hedera AccountId (bukan string address langsung)
              const info = await new AccountInfoQuery()
                .setAccountId(accountIdFromEvm)
                .execute(client);

              const hederaAddress = info.accountId.toString();
              setHederaAccountId(hederaAddress); // Ini udah "0.0.num"
              setWalletContext(hederaAddress);
                 try {
                    const user = await walletAccountService.upsertWalletAccount(hederaAddress, chainId);
                    if (user) {
                    }
                  } catch (error) {
                    console.error('Failed to save user data to Supabase:', error);
                  }
            } catch (err) {
              console.error("Failed to resolve Hedera account ID:", err);
            }
      }
    };

    handleWalletConnection();
  }, [isConnected, hederaAccountId, chainId]);

  // Handle wallet disconnection
  useEffect(() => {
    const handleWalletDisconnection = async () => {
      if (!isConnected && address) {
        setWalletContext(address);
        try {
          await walletAccountService.setUserInactive(address);
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
    hederaAccountId
  };
};
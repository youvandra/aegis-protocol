import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { walletAccountService, WalletAccount } from '../lib/supabase';
import { RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react';

const WalletDebugInfo: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [walletAccount, setWalletAccount] = useState<WalletAccount | null>(null);
  const [allAccounts, setAllAccounts] = useState<WalletAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Test connection
      const connectionTest = await walletAccountService.testConnection();
      if (!connectionTest) {
        throw new Error('Cannot connect to Supabase');
      }

      // Get current wallet account
      const account = await walletAccountService.getWalletAccount(address);
      setWalletAccount(account);

      // Get all accounts
      const accounts = await walletAccountService.getAllWalletAccounts();
      setAllAccounts(accounts);
      
      console.log('Fetched wallet data:', { account, totalAccounts: accounts.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchWalletData();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Wallet not connected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Wallet Account Debug Info
        </h3>
        <button
          onClick={fetchWalletData}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-900">Connected Wallet:</span>
        </div>
        <p className="text-xs font-mono text-gray-600 break-all">{address}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Error:</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Current Wallet Account */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Wallet in Database:</h4>
        {walletAccount ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium text-green-800">ID:</span>
                <p className="text-green-700 font-mono">{walletAccount.id}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Connections:</span>
                <p className="text-green-700">{walletAccount.connection_count}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">First Connected:</span>
                <p className="text-green-700">{new Date(walletAccount.first_connected_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Last Connected:</span>
                <p className="text-green-700">{new Date(walletAccount.last_connected_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-600">No account found in database</p>
          </div>
        )}
      </div>

      {/* All Accounts Summary */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          All Wallet Accounts ({allAccounts.length}):
        </h4>
        {allAccounts.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {allAccounts.map((account) => (
              <div key={account.id} className="bg-gray-50 rounded-md p-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-gray-600">
                    {account.wallet_address.slice(0, 10)}...{account.wallet_address.slice(-8)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {account.connection_count} connections
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-600">No accounts found in database</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDebugInfo;
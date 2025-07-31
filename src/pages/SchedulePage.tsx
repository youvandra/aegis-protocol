import React from 'react';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Wallet } from 'lucide-react';
import AestheticNavbar from '../components/AestheticNavbar';

const DataPage: React.FC = () => {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();

  return (
    <div className="min-h-screen relative flex flex-col bg-[#D9D9D9]">
      <AestheticNavbar 
        leftLinkPath="/relay"
        leftLinkText="Relay"
        roomName="Data"
        rightLinkPath="/legacy"
        rightLinkText="Legacy"
      />
      <main className="flex-1 px-8 pt-0">
        <div className="max-w-7xl mx-auto">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl max-w-md">
                <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Wallet Required
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Access to data insights and analytics requires a connected wallet. 
                  Connect your wallet to unlock powerful portfolio tracking and analysis tools.
                </p>
                <button
                  onClick={() => open()}
                  className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-20 text-center md:text-left">
              {/* Data page content will go here */}
            </div>
          )}
          </div>
      </main>
    </div>
  );
};

export default DataPage;

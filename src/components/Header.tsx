import React from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';

interface HeaderProps {
  onWalletRequired?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onWalletRequired }) => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if (!isConnected && (path === '/data' || path === '/legacy' || path === '/relay')) {
      e.preventDefault();
      if (onWalletRequired) {
        onWalletRequired();
      } else {
        open();
      }
    }
  };

  return (
    <header className="w-full py-8 px-8">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center">
          <img 
            src="/logoap.png" 
            alt="Aegis Protocol" 
            className="h-12 w-auto"
          />
        </div>
        <div className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col items-start space-y-3 md:static md:flex-row md:items-center md:space-x-8 md:space-y-0">
          <Link 
            to="/data" 
            onClick={(e) => handleNavClick(e, '/data')}
            className={`text-gray-800 hover:text-black transition-all duration-200 font-medium text-lg p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent ${!isConnected ? 'cursor-pointer' : ''}`}
          >
            Data
          </Link>
          <Link 
            to="/legacy" 
            onClick={(e) => handleNavClick(e, '/legacy')}
            className={`text-gray-800 hover:text-black transition-all duration-200 font-medium text-lg p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent ${!isConnected ? 'cursor-pointer' : ''}`}
          >
            Legacy
          </Link>
          <Link 
            to="/relay" 
            onClick={(e) => handleNavClick(e, '/relay')}
            className={`text-gray-800 hover:text-black transition-all duration-200 font-medium text-lg p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent ${!isConnected ? 'cursor-pointer' : ''}`}
          >
            Relay
          </Link>
          
          {/* Wallet Connection Status */}
          <div className="p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none">
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => open()}
                className="text-sm text-gray-600 hover:text-black transition-colors duration-200 font-medium"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
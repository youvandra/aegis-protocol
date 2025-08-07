import React from 'react';
import { Link } from 'react-router-dom';
import { useWalletTracking } from '../hooks/useWalletTracking';

interface HeaderProps {
  isConnected: boolean;
  onWalletRequired?: () => void;
}

const Header: React.FC<HeaderProps> = ({  }) => {
  // Track wallet connections automatically
  useWalletTracking();

  return (
    <header className="w-full py-8 px-8">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center">
          <img 
            src="/logoap.png" 
            alt="Aegis Protocol" 
            className="h-16 w-auto"
          />
        </div>
        <div className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col items-start space-y-3 md:static md:flex-row md:items-center md:space-x-8 md:space-y-0">
          {/* Stream Link with Hover Card */}
          <div className="relative group">
            <Link 
              to="/stream" 
              className="text-gray-800 hover:text-black transition-all duration-200 font-medium text-sm sm:text-base md:text-lg px-2 py-1 sm:p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-md sm:shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent cursor-pointer"
            >
              Stream
            </Link>
            {/* Hover Card */}
            <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
              <h3 className="font-semibold text-gray-900 mb-2">Transfer Streams</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Automate asset transfers with precise timing and logic. Stream wealth to the right people, exactly when it matters.
              </p>
            </div>
          </div>
          
          {/* Legacy Link with Hover Card */}
          <div className="relative group">
            <Link 
              to="/legacy" 
              className="text-gray-800 hover:text-black transition-all duration-200 font-medium text-sm sm:text-base md:text-lg px-2 py-1 sm:p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-md sm:shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent cursor-pointer"
            >
              Legacy
            </Link>
            {/* Hover Card */}
            <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
              <h3 className="font-semibold text-gray-900 mb-2">Secure My Legacy</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Build a trustless legacy that activates when the time is right. No lawyers, no paperwork—just secure, automated distribution.
              </p>
            </div>
          </div>
          
          {/* Relay Link with Hover Card */}
          <div className="relative group">
            <Link 
              to="/relay" 
              className="text-gray-800 hover:text-black transition-all duration-200 font-medium text-sm sm:text-base md:text-lg px-2 py-1 sm:p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-md sm:shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent cursor-pointer"
            >
              Relay
            </Link>
            {/* Hover Card */}
            <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
              <h3 className="font-semibold text-gray-900 mb-2">Smart Way to Agree</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Relay enables synchronized smart transfers—no middleman, no delay. Facilitate secure and agreed-upon transactions.
              </p>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
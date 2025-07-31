import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  isConnected: boolean;
  onWalletRequired?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isConnected, onWalletRequired }) => {

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
            to="/stream" 
            className="text-gray-800 hover:text-black transition-all duration-200 font-medium text-lg p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent cursor-pointer"
          >
            Stream
          </Link>
          <Link 
            to="/legacy" 
            className="text-gray-800 hover:text-black transition-all duration-200 font-medium text-lg p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent cursor-pointer"
          >
            Legacy
          </Link>
          <Link 
            to="/relay" 
            className="text-gray-800 hover:text-black transition-all duration-200 font-medium text-lg p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent cursor-pointer"
          >
            Relay
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
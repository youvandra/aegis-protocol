import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
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
        <div className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col items-start space-y-3 md:static md:flex-row md:items-center md:space-x-12 md:space-y-0">
          <Link 
            to="/data" 
            className="text-gray-800 hover:text-black transition-all duration-200 font-medium text-lg p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent"
          >
            Data
          </Link>
          <Link 
            to="/legacy" 
            className="text-gray-800 hover:text-black transition-all duration-200 font-medium text-lg p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent"
          >
            Legacy
          </Link>
          <Link 
            to="/relay" 
            className="text-gray-800 hover:text-black transition-all duration-200 font-medium text-lg p-3 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg hover:shadow-xl hover:bg-white/90 md:p-0 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:hover:shadow-none md:hover:bg-transparent"
          >
            Relay
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
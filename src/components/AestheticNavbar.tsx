import React from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { DoorOpen } from 'lucide-react';

interface AestheticNavbarProps {
  leftLinkPath: string;
  leftLinkText: string;
  roomName: string;
  rightLinkPath: string;
  rightLinkText: string;
}

const AestheticNavbar: React.FC<AestheticNavbarProps> = ({
  leftLinkPath,
  leftLinkText,
  roomName,
  rightLinkPath,
  rightLinkText,
}) => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  return (
    <nav className="w-full py-8 px-8">
      <div className="max-w-7xl mx-auto relative">
        {/* Wallet Connection Section */}
        <div className="flex justify-between items-center">
          {/* Homepage Button - Left Side */}
          <Link 
            to="/"
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1 hover:bg-white/95 transition-all duration-200"
          >
            <span className="text-sm text-gray-700 hover:text-black font-medium">
              Homepage
            </span>
          </Link>
          
          {/* Wallet Connection - Right Side */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1">
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => open()}
                className="text-sm text-gray-700 hover:text-black transition-colors duration-200 font-medium"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
        
        {/* Centered Navigation Group */}
        <div className="flex items-center justify-center mt-4">
          {/* Left Navigation */}
          <Link 
            to={leftLinkPath}
            className="flex items-center space-x-1 hover:opacity-70 transition-opacity duration-200 mr-8"
          >
            <span className="text-2xl">←</span>
            <span className="text-base font-medium">{leftLinkText}</span>
          </Link>

          {/* Room Name */}
          <div className="text-4xl font-bold text-black">
            <DoorOpen className="inline-block mr-3" size={32} />
            <span>{roomName}</span>
          </div>

          {/* Right Navigation */}
          <Link 
            to={rightLinkPath}
            className="flex items-center space-x-1 hover:opacity-70 transition-opacity duration-200 ml-8"
          >
            <span className="text-base font-medium">{rightLinkText}</span>
            <span className="text-2xl">→</span>
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default AestheticNavbar;
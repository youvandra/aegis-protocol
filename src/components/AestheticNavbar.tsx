import React from 'react';

import { Link } from 'react-router-dom';

import { useAccount, useDisconnect, useBalance } from 'wagmi';

import { useWeb3Modal } from '@web3modal/wagmi/react';

import { DoorOpen } from 'lucide-react';

import { useWalletTracking } from '../hooks/useWalletTracking';


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

  const { address } = useAccount();

  const { disconnect } = useDisconnect();

  const { open } = useWeb3Modal();

  const { isConnected } = useWalletTracking();

  

  const { data: balance } = useBalance({

    address: address,

  });


  return (

    <nav className="w-full py-8 px-8">

      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* Homepage Button - Left Side */}

        <Link 

          to="/"

          className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1 hover:bg-white/95 transition-all duration-200"

        >

          <span className="text-sm text-gray-700 hover:text-black font-medium">

            Homepage

          </span>

        </Link>

        

        {/* Centered Navigation Group */}

        <div className="hidden md:flex items-center">

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

        

        {/* Mobile Navigation */}

        <div className="md:hidden flex items-center justify-center flex-1">

          <div className="text-2xl font-bold text-black flex items-center">

            <DoorOpen className="mr-2" size={24} />

            <span>{roomName}</span>

          </div>

        </div>

        

        {/* Mobile Navigation Links */}

        <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">

          <Link 

            to={leftLinkPath}

            className="flex items-center space-x-1 hover:opacity-70 transition-opacity duration-200"

          >

            <span className="text-lg">←</span>

            <span className="text-sm font-medium">{leftLinkText}</span>

          </Link>

          <div className="w-px h-4 bg-gray-300"></div>

          <Link 

            to={rightLinkPath}

            className="flex items-center space-x-1 hover:opacity-70 transition-opacity duration-200"

          >

            <span className="text-sm font-medium">{rightLinkText}</span>

            <span className="text-lg">→</span>

          </Link>

        </div>

        

        {/* Wallet Connection - Right Side */}

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1 min-w-fit">

          {isConnected ? (

            <div className="flex items-center space-x-3">

              <div className="w-2 h-2 bg-green-500 rounded-full"></div>

              <button

                onClick={() => disconnect()}

                className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200 hidden sm:inline"

              >

              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">

                

                <span className="text-xs sm:text-sm text-gray-700 font-medium">

                  {address?.slice(0, 6)}...{address?.slice(-4)}

                </span>

                {balance && (

                  <span className="text-xs text-gray-600 font-mono">

                    {parseFloat(balance.formatted).toFixed(2)} {balance.symbol}

                  </span>

                )}

              </div>

              

              </button>

            </div>

          ) : (

            <button

              onClick={() => open()}

              className="text-xs sm:text-sm text-gray-700 hover:text-black transition-colors duration-200 font-medium"

            >

              Connect Wallet

            </button>

          )}

        </div>

      </div>

    </nav>

  );

};


export default AestheticNavbar; 
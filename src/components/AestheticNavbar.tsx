<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { DoorOpen } from "lucide-react";
import { useWalletTracking } from "../hooks/useWalletTracking";
import { AccountId, AccountInfoQuery, Client, PrivateKey } from "@hashgraph/sdk";
=======
import React from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { DoorOpen } from 'lucide-react';
import { useWalletTracking } from '../hooks/useWalletTracking';
>>>>>>> 7b2ef2df11dfc13beb6b83b8e3ea2c3ef17a5822

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
<<<<<<< HEAD
  const { data: balance } = useBalance({ address });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);

  // Resolve EVM → Hedera Account ID
useEffect(() => {
  const fetchAccountInfo = async () => {
    if (!address) {
      setHederaAccountId(null);
      return;
    }

    const MY_ACCOUNT_ID = AccountId.fromString("0.0.6496404");
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      "cd6b997c0df744d9740ef249d5643a532ad7a58450b7135b719126bb80c2a1be"
    );

    const client = Client.forTestnet().setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    try {
      // Convert EVM → Hedera AccountId instance
      const accountIdFromEvm = AccountId.fromEvmAddress(0, 0, address);

      // Query pakai Hedera AccountId (bukan string address langsung)
      const info = await new AccountInfoQuery()
        .setAccountId(accountIdFromEvm)
        .execute(client);

      setHederaAccountId(info.accountId.toString()); // Ini udah "0.0.num"
    } catch (err) {
      console.error("Failed to resolve Hedera account ID:", err);
      setHederaAccountId(null);
    }
  };

  fetchAccountInfo();
}, [address]);

=======

  const { data: balance } = useBalance({
    address: address,
  });
>>>>>>> 7b2ef2df11dfc13beb6b83b8e3ea2c3ef17a5822

  return (
    <nav className="w-full py-8 px-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
<<<<<<< HEAD
        {/* Homepage Button */}
        <Link
=======
        {/* Homepage Button - Left Side */}
        <Link 
>>>>>>> 7b2ef2df11dfc13beb6b83b8e3ea2c3ef17a5822
          to="/"
          className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1 hover:bg-white/95 transition-all duration-200"
        >
          <span className="text-sm text-gray-700 hover:text-black font-medium">
            Homepage
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center">
<<<<<<< HEAD
          <Link
=======
          {/* Left Navigation */}
          <Link 
>>>>>>> 7b2ef2df11dfc13beb6b83b8e3ea2c3ef17a5822
            to={leftLinkPath}
            className="flex items-center space-x-1 hover:opacity-70 transition-opacity duration-200 mr-8"
          >
            <span className="text-2xl">←</span>
            <span className="text-base font-medium">{leftLinkText}</span>
          </Link>

          <div className="text-4xl font-bold text-black">
            <DoorOpen className="inline-block mr-3" size={32} />
            <span>{roomName}</span>
          </div>

<<<<<<< HEAD
          <Link
=======
          {/* Right Navigation */}
          <Link 
>>>>>>> 7b2ef2df11dfc13beb6b83b8e3ea2c3ef17a5822
            to={rightLinkPath}
            className="flex items-center space-x-1 hover:opacity-70 transition-opacity duration-200 ml-8"
          >
            <span className="text-base font-medium">{rightLinkText}</span>
            <span className="text-2xl">→</span>
          </Link>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-center flex-1">
          <div className="text-2xl font-bold text-black flex items-center">
            <DoorOpen className="mr-2" size={24} />
            <span>{roomName}</span>
          </div>
        </div>

<<<<<<< HEAD
        {/* Mobile Bottom Nav */}
=======
        {/* Mobile Navigation Links */}
>>>>>>> 7b2ef2df11dfc13beb6b83b8e3ea2c3ef17a5822
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

<<<<<<< HEAD
        {/* Wallet Connection */}
=======
        {/* Wallet Connection - Right Side */}
>>>>>>> 7b2ef2df11dfc13beb6b83b8e3ea2c3ef17a5822
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1 min-w-fit">
          {isConnected ? (
            <div className="flex items-center space-x-3 relative">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
<<<<<<< HEAD
              <div className="relative">
                <button
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200 hidden sm:inline px-2 py-1 rounded"
                  onClick={() => setDropdownOpen((open) => !open)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">
                      {hederaAccountId
                        ? `${hederaAccountId}`
                        : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </span>
                    {balance && (
                      <span className="text-xs text-gray-600 font-mono">
                        {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                      </span>
                    )}
                  </div>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(hederaAccountId || address || "");
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      Copy Address
                    </button>
                    <button
                      onClick={() => {
                        disconnect();
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-gray-100"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
=======
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
>>>>>>> 7b2ef2df11dfc13beb6b83b8e3ea2c3ef17a5822
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

<<<<<<< HEAD
export default AestheticNavbar;
=======
export default AestheticNavbar; 
>>>>>>> 7b2ef2df11dfc13beb6b83b8e3ea2c3ef17a5822

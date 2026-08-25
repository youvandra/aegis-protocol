import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Check, DoorOpen } from "lucide-react";
import { useWalletTracking } from "../hooks/useWalletTracking";

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
  // The Hedera account ID is resolved once, in the tracking hook, via the
  // public mirror node — no operator key involved.
  const { isConnected, hederaAccountId, authenticating, authError, retryAuthentication } =
    useWalletTracking();
  const { data: balance } = useBalance({ address });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on an outside click or Escape.
  useEffect(() => {
    if (!dropdownOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(hederaAccountId || address || "");
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  return (
    <nav className="w-full py-6 px-4 sm:py-8 sm:px-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
        {/* Homepage Button */}
        <Link
          to="/"
          className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1 hover:bg-white/95 transition-all duration-200"
        >
          <span className="text-sm text-gray-700 hover:text-black font-medium">
            Homepage
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center">
          <Link
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

          <Link
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

        {/* Mobile Bottom Nav */}
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

        {/* Wallet Connection */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1 min-w-fit">
          {isConnected && authError ? (
            <button
              type="button"
              onClick={retryAuthentication}
              className="flex items-center gap-2 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700"
              title={authError}
            >
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Sign-in failed — retry
            </button>
          ) : isConnected ? (
            <div className="flex items-center space-x-3 relative">
              <div
                className={`w-2 h-2 rounded-full ${
                  authenticating ? "animate-pulse bg-amber-500" : "bg-green-500"
                }`}
              ></div>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen}
                  aria-label="Wallet options"
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200 px-2 py-1 rounded"
                  onClick={() => setDropdownOpen((isOpen) => !isOpen)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">
                      {authenticating
                        ? "Signing in…"
                        : hederaAccountId ??
                          `${address?.slice(0, 6)}...${address?.slice(-4)}`}
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
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-36 bg-white rounded shadow-lg border border-gray-200 z-10"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleCopyAddress}
                      className="flex w-full items-center justify-between px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      <span>{copied ? "Copied" : "Copy Address"}</span>
                      {copied && <Check size={12} className="text-green-600" />}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
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
            </div>
          ) : (
            <button
              type="button"
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

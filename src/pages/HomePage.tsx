import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import { useWalletTracking } from '../hooks/useWalletTracking';

const HomePage: React.FC = () => {
  const { isConnected } = useWalletTracking();

  const handleWalletRequired = () => {
    open();
  };

  return (
    <>
      <Header isConnected={isConnected} onWalletRequired={handleWalletRequired} />
      <div className="flex-1">
        <Hero />
      </div>
      
      {/* Description and Footer Container */}
      <div className="w-full py-16 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          {/* Description Text - Transparent */}
          <div className="self-end">
            <p className="text-sm text-gray-300">
              © aegis.protocol 2025
            </p>
          </div>
          
          <div className="max-w-md text-white ml-8">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold text-white">Aegis Protocol</span> is building the essential trust and asset management 
              layer for the multi-trillion-dollar digital asset economy. The mass 
              adoption of crypto is critically hampered by two fundamental fears: 
              the irreversible loss of funds from simple human error, and the 
              permanent loss of assets upon an owner's death or incapacitation.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
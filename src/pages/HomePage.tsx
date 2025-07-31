import React from 'react';
import Hero from '../components/Hero';

const HomePage: React.FC = () => {
  return (
    <div className="relative">
      <div 
        className="absolute inset-0 bg-[url('/bg.webp')] bg-no-repeat bg-center bg-fixed bg-[length:1920px_auto]"
      />
      
      {/* Content */}
      <div className="relative z-10">
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
        
    </div>
      
    </div>
  );
};

export default HomePage;
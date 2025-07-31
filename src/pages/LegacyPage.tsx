import React from 'react';

const LegacyPage: React.FC = () => {
  return (
    <main className="flex-1 px-8 pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 text-center md:text-left">
          <h1 className="text-7xl md:text-9xl font-light text-black tracking-tight leading-none">
            <span className="font-normal">legacy</span>
          </h1>
        </div>
        
        <div className="relative flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-8">
              Legacy asset management solutions coming soon
            </p>
            <div className="w-16 h-1 bg-black mx-auto"></div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LegacyPage;
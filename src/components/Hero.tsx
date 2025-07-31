import React from 'react';

const Hero: React.FC = () => {
  return (
    <main className="flex-1 px-8 pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="mb-20 text-center md:text-left">
          <h1 className="text-7xl md:text-9xl font-light text-black tracking-tight leading-none">
            <span className="font-normal">aegis</span><span className="block md:inline">.protocol</span>
          </h1>
        </div>

        {/* Hero Visual Section */}
        <div className="relative flex items-center justify-center">
        </div>
      </div>
    </main>
  );
};

export default Hero;
import React from 'react';
import AestheticNavbar from '../components/AestheticNavbar';

const RelayPage: React.FC = () => {
  return (
    <div className="min-h-screen relative flex flex-col bg-[#D9D9D9]">
      <AestheticNavbar 
        leftLinkPath="/legacy"
        leftLinkText="Legacy"
        roomName="Relay"
        rightLinkPath="/data"
        rightLinkText="Data"
      />
      <main className="flex-1 px-8 pt-0">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center md:text-left">
            <h1 className="text-7xl md:text-9xl font-light text-black tracking-tight leading-none">
              <span className="font-normal">relay</span>
            </h1>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RelayPage;

import React from 'react';
import HeaderBlank from '../components/HeaderBlank';

const LegacyPage: React.FC = () => {
  return (
    <HeaderBlank>
      <main className="flex-1 px-8 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center md:text-left">
            <h1 className="text-7xl md:text-9xl font-light text-black tracking-tight leading-none">
              <span className="font-normal">legacy</span>
            </h1>
          </div>
        </div>
      </main>
    </HeaderBlank>
  );
};

export default LegacyPage;
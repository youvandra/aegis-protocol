import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import DataPage from './pages/DataPage';
import LegacyPage from './pages/LegacyPage';
import RelayPage from './pages/RelayPage';

function App() {
  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-[#DADADA] bg-[url('/bg.webp')] bg-no-repeat bg-center bg-fixed bg-[length:1920px_auto]"
      />
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/data" element={<DataPage />} />
            <Route path="/legacy" element={<LegacyPage />} />
            <Route path="/relay" element={<RelayPage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
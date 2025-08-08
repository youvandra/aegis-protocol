import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StreamPage from './pages/StreamPage';
import LegacyPage from './pages/LegacyPage';
import RelayPage from './pages/RelayPage';

function App() {
  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-[#F8F8F8] bg-[url('/bg-image.svg')] bg-no-repeat bg-center bg-fixed bg-[length:1920px_auto]"
      />
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/stream" element={<StreamPage />} />
            <Route path="/legacy" element={<LegacyPage />} />
            <Route path="/relay" element={<RelayPage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
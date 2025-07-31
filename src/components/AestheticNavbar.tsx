import React from 'react';
import { Link } from 'react-router-dom';

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
  return (
    <nav className="w-full py-8 px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-black">
        {/* Left Navigation */}
        <Link 
          to={leftLinkPath}
          className="flex items-center space-x-2 hover:opacity-70 transition-opacity duration-200"
        >
          <span className="text-2xl">←</span>
          <span className="text-lg font-medium">{leftLinkText}</span>
        </Link>

        {/* Center Room Name */}
        <div className="text-xl font-light">
          Room: <span className="font-medium">{roomName}</span>
        </div>

        {/* Right Navigation */}
        <Link 
          to={rightLinkPath}
          className="flex items-center space-x-2 hover:opacity-70 transition-opacity duration-200"
        >
          <span className="text-lg font-medium">{rightLinkText}</span>
          <span className="text-2xl">→</span>
        </Link>
      </div>
    </nav>
  );
};

export default AestheticNavbar;
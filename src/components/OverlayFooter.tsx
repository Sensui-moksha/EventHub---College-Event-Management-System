import React from 'react';

const OverlayFooter: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 pointer-events-none">
      {/* Gradient overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent backdrop-blur-sm"></div>
      
      {/* Scrolling text overlay */}
      <div className="relative overflow-hidden py-2">
        <div className="animate-scroll-left whitespace-nowrap text-sm font-elegant text-white drop-shadow-lg">
          <span className="inline-block px-8 bg-black/25 rounded-full py-1 mx-2 shadow-md">
            Developed by Mokshyagna Yadav
          </span>
        </div>
      </div>
    </div>
  );
};

export default OverlayFooter;
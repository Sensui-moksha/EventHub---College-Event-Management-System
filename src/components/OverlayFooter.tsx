import React from 'react';

const OverlayFooter: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 pointer-events-none">
      {/* Gradient overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent backdrop-blur-sm"></div>
      
      {/* Scrolling text overlay */}
      <div className="relative overflow-hidden py-2">
        <div className="animate-scroll-left whitespace-nowrap text-sm font-elegant text-white drop-shadow-lg">
          <span className="inline-block px-8 py-1 mx-2 rounded-full bg-black/40 shadow-md">
            ©️ 2025 Event Management System. Developed by Mokshyagna Yadav, Department of Computer Science and Engineering. This project is a part of academic work. All Rights Reserved.
          </span>
        </div>
      </div>
    </div>
  );
};

export default OverlayFooter;
import React from 'react';

interface ChatDoodleBgProps {
  isDark?: boolean;
}

export const ChatDoodleBg: React.FC<ChatDoodleBgProps> = ({ isDark }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none transition-colors duration-300 ${
        isDark ? 'bg-[#0b141a]' : 'bg-[#efeae2]'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, ${
          isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
        } 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Repeating SVG Doodle Pattern */}
      <svg
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isDark ? 'opacity-[0.045] invert' : 'opacity-[0.065]'
        }`}
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="whatsapp-doodle"
            width="180"
            height="180"
            patternUnits="userSpaceOnUse"
          >
            {/* Camera */}
            <path
              d="M25 35h15l3-4h14l3 4h15a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4V39a4 4 0 0 1 4-4zm27 26a11 11 0 1 0 0-22 11 11 0 0 0 0 22z"
              fill="none"
              stroke="#000"
              strokeWidth="1.8"
            />
            {/* Heart */}
            <path
              d="M120 40c-6-10-18-4-18 4 0 8 18 18 18 18s18-10 18-18c0-8-12-14-18-4z"
              fill="none"
              stroke="#000"
              strokeWidth="1.8"
            />
            {/* Speech bubble */}
            <path
              d="M30 115a18 18 0 0 1 28-14 18 18 0 0 1 4 23l-3 7-7-3a18 18 0 0 1-22-13z"
              fill="none"
              stroke="#000"
              strokeWidth="1.8"
            />
            {/* Musical note */}
            <path
              d="M135 110v18a6 6 0 1 1-5-6h5v-16h16v18a6 6 0 1 1-5-6h5v-20z"
              fill="none"
              stroke="#000"
              strokeWidth="1.8"
            />
            {/* Paper Airplane */}
            <path
              d="M80 80l24-12-12 24-4-8z"
              fill="none"
              stroke="#000"
              strokeWidth="1.8"
            />
            {/* Smiley */}
            <circle cx="100" cy="140" r="12" fill="none" stroke="#000" strokeWidth="1.8" />
            <circle cx="96" cy="136" r="1.5" fill="#000" />
            <circle cx="104" cy="136" r="1.5" fill="#000" />
            <path d="M96 143a4 4 0 0 0 8 0" fill="none" stroke="#000" strokeWidth="1.5" />
            {/* Star */}
            <path
              d="M50 80l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z"
              fill="none"
              stroke="#000"
              strokeWidth="1.8"
            />
            {/* Coffee cup */}
            <path
              d="M140 70h12v10a6 6 0 0 1-6 6h0a6 6 0 0 1-6-6zm12 2h3a3 3 0 0 1 0 6h-3"
              fill="none"
              stroke="#000"
              strokeWidth="1.8"
            />
            {/* Sun */}
            <circle cx="35" cy="155" r="7" fill="none" stroke="#000" strokeWidth="1.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#whatsapp-doodle)" />
      </svg>
    </div>
  );
};

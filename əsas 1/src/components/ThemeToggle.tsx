import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      id="theme-toggle-button"
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'İşıqlı rejimə keç (Light mode)' : 'Qaranlıq rejimə keç (Dark mode)'}
      aria-label="Toggle light/dark theme"
      className={`relative flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300 backdrop-blur-md shadow-sm active:scale-90 cursor-pointer ${
        isDark
          ? 'bg-white/10 hover:bg-white/15 border-white/20 text-amber-300 hover:text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
          : 'bg-black/5 hover:bg-black/10 border-black/15 text-indigo-900 hover:text-black shadow-[0_2px_10px_rgba(0,0,0,0.06)]'
      }`}
    >
      <div className="relative w-4.5 h-4.5 flex items-center justify-center">
        {isDark ? (
          <Sun size={17} className="transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon size={17} className="transition-transform duration-300 -rotate-12 scale-100" />
        )}
      </div>
    </button>
  );
};

import React from 'react';
import { Home as HomeIcon, LayoutGrid, ShoppingBag, BookOpen } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export type StoreTab = 'home' | 'catalog' | 'cart' | 'library' | 'campaign';

interface StoreBottomBarProps {
  activeTab: StoreTab;
  onTabChange: (tab: StoreTab) => void;
  cartCount: number;
}

export const StoreBottomBar: React.FC<StoreBottomBarProps> = ({
  activeTab,
  onTabChange,
  cartCount,
}) => {
  const { isDark } = useTheme();

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none flex justify-center">
      <nav
        style={{
          background: isDark ? 'rgba(16, 24, 38, 0.42)' : 'rgba(255, 255, 255, 0.32)',
          backdropFilter: 'blur(30px) saturate(190%)',
          WebkitBackdropFilter: 'blur(30px) saturate(190%)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.22)'
            : '1px solid rgba(255, 255, 255, 0.65)',
          boxShadow: isDark
            ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.35), 0 12px 40px rgba(0, 0, 0, 0.5)'
            : 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.95), 0 12px 35px rgba(0, 0, 0, 0.08)',
        }}
        className="pointer-events-auto w-full max-w-sm sm:max-w-md rounded-[28px] sm:rounded-3xl transition-all duration-300"
      >
        <div className="px-2 sm:px-4 py-2.5 grid grid-cols-4 items-center justify-items-center relative">
          {/* 1. EV (STORE HOME) */}
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className="flex flex-col items-center gap-1 cursor-pointer select-none group w-full"
            aria-label="Mağaza Əsas"
          >
            <div
              className={`p-2 rounded-2xl transition-all ${
                activeTab === 'home'
                  ? isDark
                    ? 'text-white'
                    : 'text-gray-950'
                  : isDark
                  ? 'text-white/60 hover:text-white group-hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-950 group-hover:bg-gray-100'
              }`}
            >
              <HomeIcon size={22} />
            </div>
            {/* Active Indicator Dot */}
            {activeTab === 'home' ? (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-white' : 'bg-gray-950'
                }`}
              />
            ) : (
              <span className="text-[10px] font-semibold opacity-70">Ev</span>
            )}
          </button>

          {/* 2. KATALOQ */}
          <button
            type="button"
            onClick={() => onTabChange('catalog')}
            className="flex flex-col items-center gap-1 cursor-pointer select-none group w-full"
            aria-label="Kataloq"
          >
            <div
              className={`p-2 rounded-2xl transition-all ${
                activeTab === 'catalog'
                  ? isDark
                    ? 'text-white'
                    : 'text-gray-950'
                  : isDark
                  ? 'text-white/60 hover:text-white group-hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-950 group-hover:bg-gray-100'
              }`}
            >
              <LayoutGrid size={22} />
            </div>
            {/* Active Indicator Dot */}
            {activeTab === 'catalog' ? (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-white' : 'bg-gray-950'
                }`}
              />
            ) : (
              <span className="text-[10px] font-semibold opacity-70">Kataloq</span>
            )}
          </button>

          {/* 3. SƏBƏT */}
          <button
            type="button"
            onClick={() => onTabChange('cart')}
            className="flex flex-col items-center gap-1 cursor-pointer relative select-none group w-full"
            aria-label="Səbət"
          >
            <div
              className={`p-2 rounded-2xl relative transition-all ${
                activeTab === 'cart'
                  ? isDark
                    ? 'text-white'
                    : 'text-gray-950'
                  : isDark
                  ? 'text-white/60 hover:text-white group-hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-950 group-hover:bg-gray-100'
              }`}
            >
              <ShoppingBag size={22} />
              {/* Badge if user has items in cart */}
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            {/* Active Indicator Dot */}
            {activeTab === 'cart' ? (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-white' : 'bg-gray-950'
                }`}
              />
            ) : (
              <span className="text-[10px] font-semibold opacity-70">Səbət</span>
            )}
          </button>

          {/* 4. KİTABXANAM */}
          <button
            type="button"
            onClick={() => onTabChange('library')}
            className="flex flex-col items-center gap-1 cursor-pointer select-none group w-full"
            aria-label="Kitabxanam"
          >
            <div
              className={`p-2 rounded-2xl transition-all ${
                activeTab === 'library'
                  ? isDark
                    ? 'text-white'
                    : 'text-gray-950'
                  : isDark
                  ? 'text-white/60 hover:text-white group-hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-950 group-hover:bg-gray-100'
              }`}
            >
              <BookOpen size={22} />
            </div>
            {/* Active Indicator Dot */}
            {activeTab === 'library' ? (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-white' : 'bg-gray-950'
                }`}
              />
            ) : (
              <span className="text-[10px] font-semibold opacity-70">Kitabxanam</span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};

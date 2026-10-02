import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { StoreAdBanner, StoreMainCategory } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface StoreAdCarouselProps {
  banners: StoreAdBanner[];
  onSelectCategory?: (category: StoreMainCategory) => void;
  onBannerClick?: (banner: StoreAdBanner) => void;
}

export const StoreAdCarousel: React.FC<StoreAdCarouselProps> = ({
  banners,
  onSelectCategory,
  onBannerClick,
}) => {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [isPausedByInteraction, setIsPausedByInteraction] = useState(false);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Əl ilə toxunulduqda və ya sürüşdürüldükdə 10 saniyə avto-sürüşmə dayanır, sonra bərpa olunur
  const triggerManualInteractionPause = () => {
    setIsPausedByInteraction(true);
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }
    pauseTimerRef.current = setTimeout(() => {
      setIsPausedByInteraction(false);
    }, 10000); // 10 saniyə hərəkət etməsin
  };

  // Avtomatik olaraq 3 saniyədən bir sol tərəfə sürüşür
  useEffect(() => {
    if (banners.length <= 1 || isPausedByInteraction) return;

    const interval = setInterval(() => {
      setDirection('left');
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000); // 3 saniyə

    return () => clearInterval(interval);
  }, [banners.length, isPausedByInteraction]);

  // Clean up pause timer on unmount
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  const handleNext = () => {
    triggerManualInteractionPause();
    setDirection('left');
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    triggerManualInteractionPause();
    setDirection('right');
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleDotClick = (idx: number) => {
    triggerManualInteractionPause();
    setDirection(idx > currentIndex ? 'left' : 'right');
    setCurrentIndex(idx);
  };

  // Əl ilə sürüşdürmə (Touch / Swipe dəstəyi)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 45) {
        // Sola sürüşdürmə -> Növbəti
        handleNext();
      } else if (diff < -45) {
        // Sağa sürüşdürmə -> Əvvəlki
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!banners.length) return null;
  const currentBanner = banners[currentIndex] || banners[0];

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl group select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner Slayder Sahəsi */}
      <div className="relative h-44 sm:h-52 md:h-56 w-full rounded-3xl overflow-hidden shadow-xl border border-white/10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0, x: direction === 'left' ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'left' ? -100 : 100 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Arxa plan şəkli */}
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition-transform duration-700"
            />

            {/* Qradiyent örtük */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${
                currentBanner.accentColor ||
                'from-gray-950/95 via-gray-900/85 to-transparent'
              } backdrop-blur-[1px]`}
            />

            {/* Banner Məzmunu - kliklədikdə kampaniyaya keçir */}
            <div
              onClick={() => {
                if (onBannerClick) {
                  onBannerClick(currentBanner);
                } else if (currentBanner.targetCategory && onSelectCategory) {
                  onSelectCategory(currentBanner.targetCategory);
                }
              }}
              className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between z-10 cursor-pointer"
            >
              {/* Yuxarı teq */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-black tracking-wider text-white border border-white/20 shadow-sm uppercase">
                  <Sparkles size={12} className="text-amber-300 animate-pulse" />
                  {currentBanner.tag}
                </span>

                {isPausedByInteraction && (
                  <span className="text-[10px] font-medium text-white/60 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-md">
                    Pauza: 10s
                  </span>
                )}
              </div>

              {/* Mərkəzi Başlıq və Məlumat */}
              <div className="max-w-[80%] sm:max-w-[70%] space-y-1">
                <h4 className="text-base sm:text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md">
                  {currentBanner.title}
                </h4>
                <p className="text-xs sm:text-sm text-white/85 line-clamp-2 leading-relaxed">
                  {currentBanner.subtitle}
                </p>
              </div>

              {/* Aşağı Hərəkət Düyməsi */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onBannerClick) {
                      onBannerClick(currentBanner);
                    } else if (currentBanner.targetCategory && onSelectCategory) {
                      onSelectCategory(currentBanner.targetCategory);
                    }
                  }}
                  className="px-4 py-1.5 sm:py-2 rounded-2xl bg-white text-gray-950 text-xs font-bold shadow-lg hover:bg-cyan-50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {currentBanner.buttonText || 'İndi Kəşf Et'}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Manual Ox Düymələri (Sola / Sağa) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Əvvəlki reklam"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/35 hover:bg-black/65 text-white flex items-center justify-center backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Növbəti reklam"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/35 hover:bg-black/65 text-white flex items-center justify-center backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Nöqtə indikatorları (Dots) */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        {banners.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleDotClick(idx)}
            aria-label={`Reklam ${idx + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              currentIndex === idx
                ? 'w-6 h-1.5 bg-cyan-500 shadow-sm'
                : isDark
                ? 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

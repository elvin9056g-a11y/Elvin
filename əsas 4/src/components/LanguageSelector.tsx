import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Language } from '../types';
import { useTheme } from '../context/ThemeContext';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  const activeLang = languages.find((l) => l.code === currentLanguage) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left z-30" ref={dropdownRef}>
      <button
        type="button"
        id="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer ${
          isDark
            ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
            : 'bg-black/5 hover:bg-black/10 border-black/15 text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.04)]'
        }`}
      >
        <span className="text-sm">{activeLang.flag}</span>
        <span className="uppercase tracking-wider font-semibold">{activeLang.code}</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            isDark ? 'text-white/70' : 'text-gray-600'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-44 rounded-2xl backdrop-blur-xl border shadow-2xl overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
            isDark
              ? 'bg-[#18191f]/95 border-white/20 text-white'
              : 'bg-white/95 border-black/10 text-gray-900 shadow-[0_15px_35px_rgba(0,0,0,0.12)]'
          }`}
        >
          <div
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest border-b mb-1 flex items-center gap-1.5 ${
              isDark ? 'text-white/40 border-white/10' : 'text-gray-500 border-black/10'
            }`}
          >
            <Globe size={11} /> Dil Seçimi / Language
          </div>
          {languages.map((lang) => {
            const isSelected = lang.code === currentLanguage;
            return (
              <button
                key={lang.code}
                id={`lang-option-${lang.code}`}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-white/15 text-white font-semibold'
                      : 'bg-black/10 text-black font-semibold'
                    : isDark
                    ? 'text-white/80 hover:bg-white/10 hover:text-white'
                    : 'text-gray-700 hover:bg-black/5 hover:text-black'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
                {isSelected && <Check size={14} className={isDark ? 'text-white/90' : 'text-black'} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

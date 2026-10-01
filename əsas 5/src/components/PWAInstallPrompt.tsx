import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';
import { Translations } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PWAInstallPromptProps {
  t: Translations['pwa'];
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ t }) => {
  const { isDark } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If on mobile browser where event isn't supported immediately, still show the install button after 2 seconds
    const timer = setTimeout(() => {
      if (!isInstalled) {
        setIsVisible(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show platform guide (e.g. Add to Home Screen in iOS or Chrome)
      setShowGuide(true);
    }
  };

  if (isInstalled || !isVisible) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div
          className={`flex items-center justify-between gap-3 p-3 rounded-2xl backdrop-blur-xl border shadow-2xl ${
            isDark
              ? 'bg-black/60 border-white/20 text-white'
              : 'bg-white/85 border-black/15 text-gray-900 shadow-lg'
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? 'bg-gradient-to-tr from-white/25 to-white/10 border-white/20 text-white'
                  : 'bg-gradient-to-tr from-gray-900 to-gray-700 border-black/10 text-white'
              }`}
            >
              <Smartphone size={18} />
            </div>
            <div className="text-xs truncate">
              <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-950'}`}>
                {t.installBtn}
              </p>
              <p className={`text-[10px] truncate ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                {t.installPrompt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="pwa-install-button"
              type="button"
              onClick={handleInstallClick}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-gray-950 text-white hover:bg-black'
              }`}
            >
              <Download size={13} />
              <span>{t.installBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className={`p-1 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? 'text-white/50 hover:text-white hover:bg-white/10'
                  : 'text-gray-400 hover:text-gray-900 hover:bg-black/5'
              }`}
              aria-label={t.dismiss}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl relative ${
              isDark
                ? 'bg-[#181a20] border-white/20 text-white'
                : 'bg-white border-black/15 text-gray-950'
            }`}
          >
            <button
              onClick={() => setShowGuide(false)}
              className={`absolute top-4 right-4 p-2 rounded-full cursor-pointer transition-colors ${
                isDark
                  ? 'text-white/60 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-black hover:bg-black/5'
              }`}
            >
              <X size={18} />
            </button>

            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-gray-900 border-black/20 text-white'
              }`}
            >
              <Smartphone size={24} />
            </div>

            <h3 className="text-lg font-bold mb-2">Tətbiqi Quraşdırın</h3>
            <p
              className={`text-xs mb-4 leading-relaxed ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}
            >
              Tətbiqi brauzerinizin menyusundan birbaşa əsas ekrana əlavə edərək tam ekran və yüksək sürətlə istifadə edə bilərsiniz:
            </p>

            <div
              className={`space-y-2.5 text-xs p-4 rounded-2xl border mb-5 ${
                isDark
                  ? 'text-white/80 bg-white/5 border-white/10'
                  : 'text-gray-700 bg-black/[0.03] border-black/10'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-950'}`}>
                  iPhone / iPad (Safari):
                </span>
                <span>Aşağıdakı <b>Paylaş (Share)</b> düyməsinə klikləyin, sonra <b>"Əsas Ekrana Əlavə Et" (Add to Home Screen)</b> seçin.</span>
              </div>
              <div
                className={`flex items-start gap-2 border-t pt-2 ${
                  isDark ? 'border-white/10' : 'border-black/10'
                }`}
              >
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-950'}`}>
                  Android / Chrome:
                </span>
                <span>Yuxarı sağdakı üç nöqtə <b>(⋮)</b> menyusuna daxil olub <b>"Tətbiqi quraşdır" və ya "Əsas ekrana əlavə et"</b> seçin.</span>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className={`w-full py-3 rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-gray-950 text-white hover:bg-black'
              }`}
            >
              <CheckCircle size={15} /> Başa düşdüm
            </button>
          </div>
        </div>
      )}
    </>
  );
};

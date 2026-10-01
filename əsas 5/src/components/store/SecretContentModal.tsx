import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileText,
  Lock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface SecretModalProduct {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
  secret_content?: string | null;
  parameters?: Record<string, any> | string | null;
}

interface SecretContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: SecretModalProduct | null;
}

export const SecretContentModal: React.FC<SecretContentModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  const content = product.secret_content?.trim() || '';

  // Detect any URLs inside secret_content
  const urlMatches = content.match(/https?:\/\/[^\s]+/g);
  const detectedUrl = urlMatches ? urlMatches[0] : null;

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative z-10 w-full max-w-lg rounded-t-[32px] sm:rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-[#12141c]/95 border-white/15 text-white'
            : 'bg-white/95 border-gray-200 text-gray-900'
        }`}
        style={{
          boxShadow: isDark
            ? '0 25px 60px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
            : '0 20px 50px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <KeyRound size={20} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <Lock size={10} /> Gizli Məzmun
                </span>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                  <ShieldCheck size={11} /> Əldə edilib
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base line-clamp-1 mt-0.5">
                {product.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <KeyRound size={14} className="text-amber-400" />
              <span>Məhsulun Gizli Təlimatı, Linki və ya Açarı:</span>
            </label>
            <p className="text-[11px] text-gray-400">
              Bu məlumat yalnız sizin profilinizə məxsusdur və alışınız təsdiqləndiyi üçün sizə təqdim edilir.
            </p>
          </div>

          {/* Secret Content Box */}
          {content ? (
            <div className="relative rounded-2xl bg-black/60 border border-amber-500/30 p-4 font-mono text-xs sm:text-sm text-amber-100/95 leading-relaxed break-all select-text shadow-inner">
              <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm">{content}</pre>

              {/* Actions row inside box */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10 select-none">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-300">Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>

                {detectedUrl && (
                  <a
                    href={detectedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Linkə Keç</span>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center bg-black/20">
              <FileText size={28} className="mx-auto text-gray-500 mb-2" />
              <p className="text-xs text-gray-400">
                Bu məhsul üçün hələ xüsusi gizli məzmun təyin edilməyib. Ətraflı məlumat üçün dəstək komandamızla əlaqə saxlaya bilərsiniz.
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-gray-400">
            <ShieldCheck size={15} className="text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Məxfiliyiniz qorunur. Bu açar və fayllar Supabase serverlərimiz tərəfindən şifrələnmiş şəkildə təqdim olunur.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Bağla
          </button>
        </div>
      </motion.div>
    </div>
  );
};

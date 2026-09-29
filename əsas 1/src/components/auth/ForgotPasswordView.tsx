import React, { useState } from 'react';
import { Mail, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthScreen, Translations } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { sendPasswordResetEmail } from '../../lib/supabase';

interface ForgotPasswordViewProps {
  t: Translations['forgotPassword'];
  appName: string;
  onNavigate: (screen: AuthScreen) => void;
  onCodeSent: (email: string) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  t,
  appName,
  onNavigate,
  onCodeSent,
}) => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t.errors.emailRequired);
      return;
    }
    if (!email.includes('@')) {
      setError(t.errors.emailInvalid);
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(email.trim());
      onCodeSent(email.trim());
      onNavigate('verify_otp');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err?.message || 'Şifrə sıfırlama linki göndərilərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full flex flex-col justify-between"
    >
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-2">
        <button
          type="button"
          id="forgot-back-btn"
          onClick={() => onNavigate('login')}
          className={`w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center transition-all shadow-sm cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              : 'bg-black/5 hover:bg-black/10 border-black/15 text-gray-900 shadow-sm'
          }`}
          aria-label="Back to login"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Brand Header */}
      <div className="text-center pt-2 pb-6">
        <h2
          className={`text-2xl font-normal tracking-wide italic font-syne select-none ${
            isDark ? 'text-white/90 drop-shadow-sm' : 'text-gray-900'
          }`}
        >
          {appName}
        </h2>
        <h1
          className={`mt-4 text-2xl sm:text-[26px] font-bold tracking-tight leading-snug max-w-[280px] sm:max-w-xs mx-auto ${
            isDark ? 'text-white drop-shadow-md' : 'text-gray-950'
          }`}
        >
          {t.title}
        </h1>
        <p
          className={`mt-2 text-xs max-w-[270px] mx-auto leading-relaxed ${
            isDark ? 'text-white/60' : 'text-gray-600'
          }`}
        >
          {t.description}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-3 rounded-2xl text-xs text-center backdrop-blur-md border ${
              isDark
                ? 'bg-red-500/15 border-red-500/30 text-red-200'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {error}
          </motion.div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label
            className={`block text-xs font-medium pl-2 ${
              isDark ? 'text-white/80' : 'text-gray-800'
            }`}
          >
            {t.emailLabel}
          </label>
          <div className="relative flex items-center group">
            <Mail
              size={18}
              className={`absolute left-4 z-10 pointer-events-none transition-colors duration-200 ${
                isDark
                  ? 'text-white/85 group-focus-within:text-white'
                  : 'text-gray-700 group-focus-within:text-gray-950'
              }`}
            />
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              autoComplete="email"
              className={`w-full pl-11.5 pr-4 py-3.5 rounded-full text-sm outline-none backdrop-blur-md transition-all shadow-inner border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                  : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400 shadow-sm'
              }`}
            />
          </div>
        </div>

        {/* Send Code Button */}
        <div className="pt-2">
          <button
            id="forgot-send-code-btn"
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-6 rounded-full font-medium text-sm tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.98] border shadow-lg ${
              isDark
                ? 'bg-gradient-to-r from-white/20 via-white/35 to-white/20 hover:from-white/30 hover:via-white/45 hover:to-white/30 border-white/40 text-white shadow-[0_4px_24px_rgba(255,255,255,0.12)] backdrop-blur-xl'
                : 'bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 hover:from-black hover:to-black border-black/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.18)]'
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Kod göndərilir...</span>
              </span>
            ) : (
              t.submitBtn
            )}
          </button>
        </div>
      </form>

      {/* Bottom Link */}
      <div
        className={`pt-8 pb-2 text-center text-xs ${
          isDark ? 'text-white/60' : 'text-gray-600'
        }`}
      >
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className={`hover:underline transition-colors font-medium cursor-pointer ${
            isDark ? 'text-white' : 'text-gray-950'
          }`}
        >
          {t.backToLogin}
        </button>
      </div>
    </motion.div>
  );
};

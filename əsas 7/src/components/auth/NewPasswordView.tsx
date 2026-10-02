import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthScreen, Translations } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { updateUserPassword } from '../../lib/supabase';

interface NewPasswordViewProps {
  t: Translations['newPassword'];
  appName: string;
  onNavigate: (screen: AuthScreen) => void;
}

export const NewPasswordView: React.FC<NewPasswordViewProps> = ({
  t,
  appName,
  onNavigate,
}) => {
  const { isDark } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError(t.errors.required);
      return;
    }
    if (newPassword.length < 6) {
      setError(t.errors.tooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.errors.mismatch);
      return;
    }

    setLoading(true);

    try {
      await updateUserPassword(newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Update password error:', err);
      setError(err?.message || 'Şifrə yenilənərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength calculation
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    let s = 0;
    if (pass.length >= 6) s += 1;
    if (pass.length >= 8) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;
    return s;
  };

  const strength = getStrength(newPassword);

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full text-center py-6 flex flex-col items-center justify-center space-y-4"
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center border shadow-lg ${
            isDark
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]'
              : 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.15)]'
          }`}
        >
          <CheckCircle2 size={36} />
        </div>
        <h2
          className={`text-2xl font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-gray-950'
          }`}
        >
          {t.successTitle}
        </h2>
        <p
          className={`text-xs max-w-[280px] leading-relaxed ${
            isDark ? 'text-white/70' : 'text-gray-600'
          }`}
        >
          {t.successDesc}
        </p>

        <div className="pt-4 w-full">
          <button
            id="password-success-login-btn"
            type="button"
            onClick={() => onNavigate('login')}
            className={`w-full py-3.5 px-6 rounded-full font-medium text-sm tracking-wide transition-all cursor-pointer border shadow-lg ${
              isDark
                ? 'bg-gradient-to-r from-white/20 via-white/35 to-white/20 hover:from-white/30 hover:to-white/30 border-white/40 text-white backdrop-blur-xl'
                : 'bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 hover:from-black hover:to-black border-black/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.18)]'
            }`}
          >
            {t.goToLogin}
          </button>
        </div>
      </motion.div>
    );
  }

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
          id="new-pass-back-btn"
          onClick={() => onNavigate('verify_otp')}
          className={`w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center transition-all shadow-sm cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              : 'bg-black/5 hover:bg-black/10 border-black/15 text-gray-900 shadow-sm'
          }`}
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Brand Header */}
      <div className="text-center pt-2 pb-5">
        <h2
          className={`text-2xl font-normal tracking-wide italic font-syne select-none ${
            isDark ? 'text-white/90 drop-shadow-sm' : 'text-gray-900'
          }`}
        >
          {appName}
        </h2>
        <h1
          className={`mt-4 text-2xl sm:text-[26px] font-bold tracking-tight leading-snug ${
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

        {/* New Password */}
        <div className="space-y-1.5">
          <label
            className={`block text-xs font-medium pl-2 ${
              isDark ? 'text-white/80' : 'text-gray-800'
            }`}
          >
            {t.newPasswordLabel}
          </label>
          <div className="relative flex items-center group">
            <Lock
              size={18}
              className={`absolute left-4 z-10 pointer-events-none transition-colors duration-200 ${
                isDark
                  ? 'text-white/85 group-focus-within:text-white'
                  : 'text-gray-700 group-focus-within:text-gray-950'
              }`}
            />
            <input
              id="new-password-input"
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t.newPasswordPlaceholder}
              autoComplete="new-password"
              className={`w-full pl-11.5 pr-11 py-3.5 rounded-full text-sm outline-none backdrop-blur-md transition-all shadow-inner border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                  : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400 shadow-sm'
              }`}
            />
            <button
              type="button"
              id="new-password-toggle"
              onClick={() => setShowPass(!showPass)}
              className={`absolute right-4 z-10 p-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'text-white/80 hover:text-white'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
              aria-label="Toggle password"
            >
              {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {/* Password strength indicators */}
          {newPassword && (
            <div className="flex items-center gap-1.5 px-3 pt-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    strength >= step
                      ? strength <= 2
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                      : isDark
                      ? 'bg-white/15'
                      : 'bg-black/10'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            className={`block text-xs font-medium pl-2 ${
              isDark ? 'text-white/80' : 'text-gray-800'
            }`}
          >
            {t.confirmPasswordLabel}
          </label>
          <div className="relative flex items-center group">
            <Lock
              size={18}
              className={`absolute left-4 z-10 pointer-events-none transition-colors duration-200 ${
                isDark
                  ? 'text-white/85 group-focus-within:text-white'
                  : 'text-gray-700 group-focus-within:text-gray-950'
              }`}
            />
            <input
              id="confirm-new-password-input"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.confirmPasswordPlaceholder}
              autoComplete="new-password"
              className={`w-full pl-11.5 pr-11 py-3.5 rounded-full text-sm outline-none backdrop-blur-md transition-all shadow-inner border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                  : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400 shadow-sm'
              }`}
            />
            <button
              type="button"
              id="confirm-new-password-toggle"
              onClick={() => setShowConfirm(!showConfirm)}
              className={`absolute right-4 z-10 p-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'text-white/80 hover:text-white'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
              aria-label="Toggle confirm password"
            >
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3">
          <button
            id="new-password-submit-btn"
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
                <span>Yenilənir...</span>
              </span>
            ) : (
              t.submitBtn
            )}
          </button>
        </div>
      </form>

      {/* Bottom Link */}
      <div
        className={`pt-6 pb-2 text-center text-xs ${
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
          {t.goToLogin}
        </button>
      </div>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleIcon, FacebookIcon } from '../SocialIcons';
import { AuthScreen, Translations, UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  signUpWithEmail,
  signInWithOAuthProvider,
  mapSupabaseUserToProfile,
  fetchOrCreateUserProfile,
} from '../../lib/supabase';

interface SignUpViewProps {
  t: Translations['signup'];
  appName: string;
  onNavigate: (screen: AuthScreen) => void;
  onSignUpSuccess: (user: UserProfile) => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({
  t,
  appName,
  onNavigate,
  onSignUpSuccess,
}) => {
  const { isDark } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError(t.errors.allFieldsRequired);
      return;
    }
    if (!email.includes('@')) {
      setError(t.errors.emailInvalid);
      return;
    }
    if (password.length < 6) {
      setError(t.errors.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.errors.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const data = await signUpWithEmail(email, password, firstName, lastName);
      if (data.session && data.user) {
        let profile: UserProfile;
        try {
          profile = await fetchOrCreateUserProfile(data.user, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          });
        } catch {
          profile = {
            ...mapSupabaseUserToProfile(data.user),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          };
        }
        onSignUpSuccess(profile);
      } else if (data.user) {
        setInfoMsg(
          'Qeydiyyat tamamlandı! Zəhmət olmasa email ünvanınıza gələn təsdiq linkinə klikləyin'
        );
      }
    } catch (err: any) {
      console.error('Supabase sign up error:', err);
      const msg = err?.message || '';
      if (msg.includes('already registered')) {
        setError('Bu email ünvanı ilə artıq qeydiyyatdan keçilib.');
      } else {
        setError(msg || t.errors.allFieldsRequired);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    setError(null);
    try {
      await signInWithOAuthProvider(provider);
    } catch (err: any) {
      console.error('Social sign up error:', err);
      setError(err?.message || 'Sosial şəbəkə ilə qeydiyyatda xəta baş verdi.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full flex flex-col justify-between"
    >
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
          className={`mt-3 text-2xl sm:text-[26px] font-bold tracking-tight leading-snug max-w-[280px] sm:max-w-xs mx-auto ${
            isDark ? 'text-white drop-shadow-md' : 'text-gray-950'
          }`}
        >
          {t.title}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
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

        {infoMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-3 rounded-2xl text-xs text-center backdrop-blur-md border flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{infoMsg}</span>
          </motion.div>
        )}

        {/* Ad və Soyad - User explicitly requested separate fields! */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label
              className={`block text-[11px] font-medium pl-2 ${
                isDark ? 'text-white/80' : 'text-gray-800'
              }`}
            >
              {t.firstNameLabel}
            </label>
            <div className="relative flex items-center group">
              <User
                size={16}
                className={`absolute left-3 z-10 pointer-events-none transition-colors duration-200 ${
                  isDark
                    ? 'text-white/85 group-focus-within:text-white'
                    : 'text-gray-700 group-focus-within:text-gray-950'
                }`}
              />
              <input
                id="signup-firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t.firstNamePlaceholder}
                className={`w-full pl-9.5 pr-3 py-3 rounded-full text-xs sm:text-sm outline-none backdrop-blur-md transition-all shadow-inner border ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                    : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400 shadow-sm'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              className={`block text-[11px] font-medium pl-2 ${
                isDark ? 'text-white/80' : 'text-gray-800'
              }`}
            >
              {t.lastNameLabel}
            </label>
            <div className="relative flex items-center group">
              <User
                size={16}
                className={`absolute left-3 z-10 pointer-events-none transition-colors duration-200 ${
                  isDark
                    ? 'text-white/85 group-focus-within:text-white'
                    : 'text-gray-700 group-focus-within:text-gray-950'
                }`}
              />
              <input
                id="signup-lastname"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t.lastNamePlaceholder}
                className={`w-full pl-9.5 pr-3 py-3 rounded-full text-xs sm:text-sm outline-none backdrop-blur-md transition-all shadow-inner border ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                    : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400 shadow-sm'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label
            className={`block text-[11px] font-medium pl-2 ${
              isDark ? 'text-white/80' : 'text-gray-800'
            }`}
          >
            {t.emailLabel}
          </label>
          <div className="relative flex items-center group">
            <Mail
              size={17}
              className={`absolute left-3.5 z-10 pointer-events-none transition-colors duration-200 ${
                isDark
                  ? 'text-white/85 group-focus-within:text-white'
                  : 'text-gray-700 group-focus-within:text-gray-950'
              }`}
            />
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              autoComplete="email"
              className={`w-full pl-10.5 pr-4 py-3 rounded-full text-xs sm:text-sm outline-none backdrop-blur-md transition-all shadow-inner border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                  : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400 shadow-sm'
              }`}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label
            className={`block text-[11px] font-medium pl-2 ${
              isDark ? 'text-white/80' : 'text-gray-800'
            }`}
          >
            {t.passwordLabel}
          </label>
          <div className="relative flex items-center group">
            <Lock
              size={17}
              className={`absolute left-3.5 z-10 pointer-events-none transition-colors duration-200 ${
                isDark
                  ? 'text-white/85 group-focus-within:text-white'
                  : 'text-gray-700 group-focus-within:text-gray-950'
              }`}
            />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              autoComplete="new-password"
              className={`w-full pl-10.5 pr-10.5 py-3 rounded-full text-xs sm:text-sm outline-none backdrop-blur-md transition-all shadow-inner border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                  : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400 shadow-sm'
              }`}
            />
            <button
              type="button"
              id="signup-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3.5 z-10 p-1 transition-colors cursor-pointer ${
                isDark
                  ? 'text-white/80 hover:text-white'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
              aria-label="Toggle password"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label
            className={`block text-[11px] font-medium pl-2 ${
              isDark ? 'text-white/80' : 'text-gray-800'
            }`}
          >
            {t.confirmPasswordLabel}
          </label>
          <div className="relative flex items-center group">
            <Lock
              size={17}
              className={`absolute left-3.5 z-10 pointer-events-none transition-colors duration-200 ${
                isDark
                  ? 'text-white/85 group-focus-within:text-white'
                  : 'text-gray-700 group-focus-within:text-gray-950'
              }`}
            />
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.confirmPasswordPlaceholder}
              autoComplete="new-password"
              className={`w-full pl-10.5 pr-10.5 py-3 rounded-full text-xs sm:text-sm outline-none backdrop-blur-md transition-all shadow-inner border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                  : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400 shadow-sm'
              }`}
            />
            <button
              type="button"
              id="signup-toggle-confirm-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={`absolute right-3.5 z-10 p-1 transition-colors cursor-pointer ${
                isDark
                  ? 'text-white/80 hover:text-white'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
              aria-label="Toggle confirm password"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            id="signup-submit-button"
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-6 rounded-full font-medium text-sm tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] border shadow-lg ${
              isDark
                ? 'bg-gradient-to-r from-white/20 via-white/35 to-white/20 hover:from-white/30 hover:via-white/45 hover:to-white/30 border-white/40 text-white shadow-[0_4px_24px_rgba(255,255,255,0.12)] backdrop-blur-xl'
                : 'bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 hover:from-black hover:to-black border-black/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.18)]'
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Qeydiyyat aparılır...</span>
              </span>
            ) : (
              t.submitBtn
            )}
          </button>
        </div>

        {/* Or continue with */}
        <div className="relative py-1.5">
          <div className="absolute inset-0 flex items-center">
            <div
              className={`w-full border-t ${
                isDark ? 'border-white/10' : 'border-black/10'
              }`}
            />
          </div>
          <div className="relative flex justify-center text-xs">
            <span
              className={`px-3 backdrop-blur-sm ${
                isDark ? 'text-white/50 bg-transparent' : 'text-gray-500 bg-white/70'
              }`}
            >
              {t.orContinueWith}
            </span>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="signup-google-btn"
            type="button"
            onClick={() => handleSocialSignUp('google')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-full active:scale-95 border text-xs font-medium backdrop-blur-md transition-all shadow-sm cursor-pointer ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                : 'bg-white/80 hover:bg-white border-black/10 text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            }`}
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Google</span>
          </button>

          <button
            id="signup-facebook-btn"
            type="button"
            onClick={() => handleSocialSignUp('facebook')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-full active:scale-95 border text-xs font-medium backdrop-blur-md transition-all shadow-sm cursor-pointer ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                : 'bg-white/80 hover:bg-white border-black/10 text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            }`}
          >
            <FacebookIcon className="w-4 h-4" />
            <span>Facebook</span>
          </button>
        </div>
      </form>

      {/* Switch to Login */}
      <div
        className={`pt-5 pb-2 text-center text-xs ${
          isDark ? 'text-white/60' : 'text-gray-600'
        }`}
      >
        <span>{t.alreadyHaveAccount} </span>
        <button
          type="button"
          id="go-to-login-btn"
          onClick={() => onNavigate('login')}
          className={`font-semibold hover:underline transition-colors ml-1 cursor-pointer ${
            isDark ? 'text-white' : 'text-gray-950'
          }`}
        >
          {t.loginLink}
        </button>
      </div>
    </motion.div>
  );
};

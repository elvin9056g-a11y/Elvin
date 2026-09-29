import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleIcon, FacebookIcon } from '../SocialIcons';
import { AuthScreen, Translations, UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  signInWithEmail,
  signInWithOAuthProvider,
  mapSupabaseUserToProfile,
  fetchOrCreateUserProfile,
} from '../../lib/supabase';

interface LoginViewProps {
  t: Translations['login'];
  appName: string;
  onNavigate: (screen: AuthScreen) => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  t,
  appName,
  onNavigate,
  onLoginSuccess,
}) => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
    if (!password) {
      setError(t.errors.passwordRequired);
      return;
    }

    setLoading(true);

    try {
      const data = await signInWithEmail(email, password);
      if (data.user) {
        let profile: UserProfile;
        try {
          profile = await fetchOrCreateUserProfile(data.user);
        } catch {
          profile = mapSupabaseUserToProfile(data.user);
        }
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      console.error('Supabase login error:', err);
      const msg = err?.message || '';
      if (msg.includes('Invalid login credentials')) {
        setError('Email və ya şifrə yanlışdır.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Email ünvanı hələ təsdiqlənməyib. Zəhmət olmasa email qutunuzu yoxlayın.');
      } else {
        setError(msg || t.errors.loginFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    setError(null);
    try {
      await signInWithOAuthProvider(provider);
    } catch (err: any) {
      console.error('Social login error:', err);
      setError(err?.message || 'Sosial şəbəkə ilə girişdə xəta baş verdi.');
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
              id="login-email"
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

        {/* Password */}
        <div className="space-y-1.5">
          <label
            className={`block text-xs font-medium pl-2 ${
              isDark ? 'text-white/80' : 'text-gray-800'
            }`}
          >
            {t.passwordLabel}
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
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              autoComplete="current-password"
              className={`w-full pl-11.5 pr-11 py-3.5 rounded-full text-sm outline-none backdrop-blur-md transition-all shadow-inner border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                  : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400 shadow-sm'
              }`}
            />
            <button
              type="button"
              id="login-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-4 z-10 p-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'text-white/80 hover:text-white'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between px-1 text-xs pt-0.5">
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={`flex items-center gap-2 transition-colors select-none cursor-pointer ${
              isDark ? 'text-white/70 hover:text-white' : 'text-gray-700 hover:text-black'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                rememberMe
                  ? isDark
                    ? 'bg-white/30 border-white text-white'
                    : 'bg-gray-900 border-gray-900 text-white'
                  : isDark
                  ? 'border-white/30 bg-white/5'
                  : 'border-black/30 bg-black/5'
              }`}
            >
              {rememberMe && <Check size={11} strokeWidth={3} />}
            </div>
            <span>{t.rememberMe}</span>
          </button>

          <button
            type="button"
            id="login-forgot-password-link"
            onClick={() => onNavigate('forgot_password')}
            className={`transition-colors font-medium hover:underline cursor-pointer ${
              isDark ? 'text-white/70 hover:text-white' : 'text-gray-700 hover:text-black'
            }`}
          >
            {t.forgotPassword}
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            id="login-submit-button"
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
                <span>Gözləyin...</span>
              </span>
            ) : (
              t.submitBtn
            )}
          </button>
        </div>

        {/* Or continue with */}
        <div className="relative py-2">
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
        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <button
            id="login-google-btn"
            type="button"
            onClick={() => handleSocialLogin('google')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-full active:scale-95 border text-xs font-medium backdrop-blur-md transition-all shadow-sm cursor-pointer ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                : 'bg-white/80 hover:bg-white border-black/10 text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            }`}
          >
            <GoogleIcon className="w-4 h-4" />
            <span>{t.google}</span>
          </button>

          <button
            id="login-facebook-btn"
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-full active:scale-95 border text-xs font-medium backdrop-blur-md transition-all shadow-sm cursor-pointer ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                : 'bg-white/80 hover:bg-white border-black/10 text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            }`}
          >
            <FacebookIcon className="w-4 h-4" />
            <span>{t.facebook}</span>
          </button>
        </div>
      </form>

      {/* Switch to Sign Up */}
      <div
        className={`pt-6 pb-2 text-center text-xs ${
          isDark ? 'text-white/60' : 'text-gray-600'
        }`}
      >
        <span>{t.noAccount} </span>
        <button
          type="button"
          id="go-to-signup-btn"
          onClick={() => onNavigate('signup')}
          className={`font-semibold hover:underline transition-colors ml-1 cursor-pointer ${
            isDark ? 'text-white' : 'text-gray-950'
          }`}
        >
          {t.createAccount}
        </button>
      </div>
    </motion.div>
  );
};

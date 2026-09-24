/**
 * SPDX-FileCopyrightText: 2026 Lumora
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import { AuthScreen, Language, UserProfile } from './types';
import { translations } from './data/translations';
import { SilhouetteIllusion } from './components/SilhouetteIllusion';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageSelector } from './components/LanguageSelector';
import { LoginView } from './components/auth/LoginView';
import { SignUpView } from './components/auth/SignUpView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { OtpVerificationView } from './components/auth/OtpVerificationView';
import { NewPasswordView } from './components/auth/NewPasswordView';
import { HomeView } from './components/home/HomeView';
import { useTheme } from './context/ThemeContext';
import {
  supabase,
  mapSupabaseUserToProfile,
  signOutUser,
  updateUserProfileMeta,
} from './lib/supabase';

// Demo profile for instant 1-click preview
export const DEMO_USER_PROFILE: UserProfile = {
  id: 'usr_12345678',
  userCode: '12345678',
  firstName: 'Elvin',
  lastName: 'Səmədov',
  email: 'elvin9056g@gmail.com',
  balance: 0.0,
  profession: 'Dizayner',
  experience: '1 il',
  tags: ['Qrafik dizayn', 'Motion dizayn', 'Logo dizayn'],
  createdAt: new Date().toISOString(),
};

export default function App() {
  const { isDark } = useTheme();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('az');
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [resetEmail, setResetEmail] = useState('');

  // Current authenticated user. If null, show Auth (Login/Signup). If set, show Home (Ev).
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('lumora_user_profile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read cached profile:', e);
    }
    return null;
  });

  const t = translations[currentLanguage];

  // Listen to Supabase Auth state and restore session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const mapped = mapSupabaseUserToProfile(session.user);
        setCurrentUser(mapped);
        localStorage.setItem('lumora_user_profile', JSON.stringify(mapped));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const mapped = mapSupabaseUserToProfile(session.user);
        setCurrentUser(mapped);
        localStorage.setItem('lumora_user_profile', JSON.stringify(mapped));
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('lumora_user_profile');
      } else if (event === 'PASSWORD_RECOVERY') {
        setCurrentUser(null);
        setCurrentScreen('new_password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update profile from edit modal
  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updated };
      localStorage.setItem('lumora_user_profile', JSON.stringify(merged));
      return merged;
    });

    try {
      await updateUserProfileMeta(updated);
    } catch (err) {
      console.warn('Supabase update metadata error:', err);
    }
  };

  // Called when login is successful -> directs user immediately to Ev (Home)
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('lumora_user_profile', JSON.stringify(user));
  };

  // Called when registration is successful -> directs user immediately to Ev (Home)
  const handleSignUpSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('lumora_user_profile', JSON.stringify(user));
  };

  // Quick 1-click Demo Login as Elvin Səmədov
  const handleDemoLogin = () => {
    setCurrentUser(DEMO_USER_PROFILE);
    localStorage.setItem('lumora_user_profile', JSON.stringify(DEMO_USER_PROFILE));
  };

  // Logout -> signs out and directs user back to Login screen
  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentUser(null);
    localStorage.removeItem('lumora_user_profile');
    setCurrentScreen('login');
  };

  return (
    <div
      className={`min-h-screen w-full min-w-full flex flex-col justify-between font-sans relative overflow-x-hidden transition-colors duration-300 m-0 p-0 ${
        currentUser
          ? isDark
            ? 'bg-[#0e1015] text-white selection:bg-cyan-500/20 selection:text-cyan-400' // Ev və digər səhifələr üçün seçilmiş təmiz, düz qara-slate rəngi
            : 'bg-[#f5f7fb] text-gray-900 selection:bg-cyan-500/20 selection:text-cyan-800' // Ev və digər səhifələr üçün seçilmiş təmiz, düz açıq-pastel rəngi
          : isDark
          ? 'bg-[#0d0e12] text-white selection:bg-white/20 selection:text-white'
          : 'bg-[#f4f6fb] text-gray-900 selection:bg-black/10 selection:text-black'
      }`}
    >
      {/* Dynamic Smoky Silhouette Illusion in background - ONLY ON REGISTRATION / AUTH */}
      {!currentUser && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <SilhouetteIllusion />
        </div>
      )}

      {/* Ambient background soft glow layers - ONLY ON REGISTRATION / AUTH */}
      {!currentUser && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[140px] ${
              isDark
                ? 'bg-gradient-to-tr from-cyan-900/10 via-white/[0.02] to-transparent'
                : 'bg-gradient-to-tr from-blue-200/25 to-transparent'
            }`}
          />
          <div
            className={`absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full blur-[100px] ${
              isDark ? 'bg-cyan-950/20' : 'bg-indigo-100/40'
            }`}
          />
        </div>
      )}

      {/* Website Top Navigation Header - Shown only on Registration / Auth screens */}
      {!currentUser && (
        <header className="relative z-30 w-full max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <span
              className={`text-2xl sm:text-3xl font-normal italic font-syne tracking-wide drop-shadow-sm select-none ${
                isDark ? 'text-white' : 'text-gray-950'
              }`}
            >
              Lumora
            </span>
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md ${
                isDark
                  ? 'bg-white/10 border-white/15 text-white/70'
                  : 'bg-black/5 border-black/10 text-gray-700'
              }`}
            >
              <Sparkles size={11} className="text-amber-400" /> AI Ecosystem
            </span>
          </div>

          {/* Right Header Controls: ONLY on Registration / Auth screens (as requested by user) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle />
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
            />
          </div>
        </header>
      )}

      {/* Main Content Area: Renders HomeView if logged in, or Auth screens if not */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-start w-full min-w-full m-0 p-0">
        <AnimatePresence mode="wait">
          {currentUser ? (
            /* ==================================================== */
            /* 1. EV (HOME) VIEW - Shown when Login/Signup succeeds  */
            /* ==================================================== */
            <motion.div
              key="home-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full min-w-full flex-1 flex justify-center m-0 p-0"
            >
              <HomeView
                currentUser={currentUser}
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
                t={t}
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
              />
            </motion.div>
          ) : (
            /* ==================================================== */
            /* 2. AUTH VIEW - Shown when user is not logged in      */
            /* ==================================================== */
            <motion.main
              key="auth-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full flex-1 flex items-center justify-center px-4 py-8"
            >
              <div
                id="lumora-auth-card"
                className={`w-full max-w-md sm:max-w-[440px] backdrop-blur-2xl rounded-3xl border p-6 sm:p-8 transition-all duration-300 shadow-2xl ${
                  isDark
                    ? 'bg-[#14151a]/75 hover:bg-[#14151a]/85 border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(255,255,255,0.04)] text-white'
                    : 'bg-white/85 hover:bg-white/95 border-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_0_20px_rgba(0,0,0,0.03)] text-gray-900'
                }`}
              >
                <AnimatePresence mode="wait">
                  {currentScreen === 'login' ? (
                    <LoginView
                      key="login-view"
                      t={t.login}
                      appName={t.appName}
                      onNavigate={setCurrentScreen}
                      onLoginSuccess={handleLoginSuccess}
                      onDemoLogin={handleDemoLogin}
                    />
                  ) : currentScreen === 'signup' ? (
                    <SignUpView
                      key="signup-view"
                      t={t.signup}
                      appName={t.appName}
                      onNavigate={setCurrentScreen}
                      onSignUpSuccess={handleSignUpSuccess}
                    />
                  ) : currentScreen === 'forgot_password' ? (
                    <ForgotPasswordView
                      key="forgot-password-view"
                      t={t.forgotPassword}
                      appName={t.appName}
                      onNavigate={setCurrentScreen}
                      onCodeSent={(email) => setResetEmail(email)}
                    />
                  ) : currentScreen === 'verify_otp' ? (
                    <OtpVerificationView
                      key="otp-verification-view"
                      t={t.otp}
                      appName={t.appName}
                      email={resetEmail}
                      onNavigate={setCurrentScreen}
                      onVerified={() => {}}
                    />
                  ) : (
                    <NewPasswordView
                      key="new-password-view"
                      t={t.newPassword}
                      appName={t.appName}
                      onNavigate={setCurrentScreen}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

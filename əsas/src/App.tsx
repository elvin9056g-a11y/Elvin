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
  mapProfileRowToUserProfile,
  fetchOrCreateUserProfile,
  updateUserProfileInDb,
  signOutUser,
  setUserOnlineStatus,
  updateMessagesToDelivered,
  isUuid,
} from './lib/supabase';

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
        const parsed = JSON.parse(saved);
        // Avtomatik təmizləmə: Əgər 'usr_12345678' (demo) olarsa dərhal sil
        if (parsed?.id === 'usr_12345678' || parsed?.userCode === '12345678') {
          localStorage.removeItem('lumora_user_profile');
          return null;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read cached profile:', e);
    }
    return null;
  });

  const t = translations[currentLanguage];

  // Sync profile directly from public.profiles table
  const syncUserProfile = async (user: any) => {
    try {
      const profile = await fetchOrCreateUserProfile(user);
      setCurrentUser(profile);
      try {
        localStorage.setItem('lumora_user_profile', JSON.stringify(profile));
      } catch (e) {}
      return profile;
    } catch (err) {
      console.error('syncUserProfile error:', err);
      const fallback = mapSupabaseUserToProfile(user);
      setCurrentUser(fallback);
      return fallback;
    }
  };

  // Listen to Supabase Auth state and restore session
  useEffect(() => {
    // Demo profil yoxlanışı və təmizlənməsi
    try {
      const saved = localStorage.getItem('lumora_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id === 'usr_12345678' || parsed?.userCode === '12345678') {
          localStorage.removeItem('lumora_user_profile');
          setCurrentUser(null);
          setCurrentScreen('login');
        }
      }
    } catch (e) {
      console.warn('Storage check error:', e);
    }

    // Aktiv Supabase sessiyası yoxlanışı: Sessiya yoxdursa dərhal sil və Login ekranını göstər
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error || !session?.user) {
          setCurrentUser(null);
          try {
            localStorage.removeItem('lumora_user_profile');
          } catch (e) {}
          setCurrentScreen('login');
          return;
        }

        await syncUserProfile(session.user);
      })
      .catch((err) => {
        console.warn('getSession error:', err);
        setCurrentUser(null);
        try {
          localStorage.removeItem('lumora_user_profile');
        } catch (e) {}
        setCurrentScreen('login');
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        await syncUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        try {
          localStorage.removeItem('lumora_user_profile');
        } catch (e) {}
        setCurrentScreen('login');
      } else if (event === 'PASSWORD_RECOVERY') {
        setCurrentUser(null);
        setCurrentScreen('new_password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // WhatsApp Tipli "Online/Offline" və "Son Görülmə" Sistemi:
  // - Sayta daxil olanda və ya App.tsx yüklənəndə: is_online: true, last_seen: new Date()
  // - Səhifə bağlananda, çıxanda və ya visibilitychange (hidden) olduqda: is_online: false, last_seen: new Date()
  useEffect(() => {
    if (!currentUser?.id || !isUuid(currentUser.id)) return;
    const userId = currentUser.id;

    // 1. Dərhal online və last_seen qeyd edilsin + gözləyən mesajlar 'delivered' edilsin
    setUserOnlineStatus(userId, true);
    updateMessagesToDelivered(userId);

    // 2. Dövri heartbeat: hər 45 saniyədən bir online və son görülmə vaxtı yenilənir
    const heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setUserOnlineStatus(userId, true);
      }
    }, 45000);

    // 3. visibilitychange: istifadəçi səhifədən çıxdıqda və ya başqa taba keçdikdə (hidden) -> is_online: false
    // Yenidən qayıtdıqda (visible) -> is_online: true
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setUserOnlineStatus(userId, true);
        updateMessagesToDelivered(userId);
      } else {
        setUserOnlineStatus(userId, false);
      }
    };

    const handleFocus = () => {
      setUserOnlineStatus(userId, true);
      updateMessagesToDelivered(userId);
    };

    // 4. Səhifə bağlananda və ya tətbiqdən çıxanda dərhal oflayn edilsin
    const handleBeforeUnload = () => {
      setUserOnlineStatus(userId, false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      setUserOnlineStatus(userId, false);
    };
  }, [currentUser?.id]);

  // Update profile from edit modal directly in public.profiles table
  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const optimisticMerged = { ...currentUser, ...updated };
    setCurrentUser(optimisticMerged);
    try {
      localStorage.setItem('lumora_user_profile', JSON.stringify(optimisticMerged));
    } catch (e) {}

    try {
      const dbProfile = await updateUserProfileInDb(currentUser.id, updated);
      if (dbProfile) {
        setCurrentUser(dbProfile);
        try {
          localStorage.setItem('lumora_user_profile', JSON.stringify(dbProfile));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Supabase update error:', err);
    }
  };

  // Called when login is successful -> directs user immediately to Ev (Home)
  const handleLoginSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('lumora_user_profile', JSON.stringify(user));
    } catch (e) {}
    if (user.id) {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          const mapped = mapProfileRowToUserProfile(data);
          if (user.firstName && (!mapped.firstName || mapped.firstName === 'İstifadəçi')) {
            mapped.firstName = user.firstName;
          }
          if (user.lastName && !mapped.lastName) {
            mapped.lastName = user.lastName;
          }
          setCurrentUser(mapped);
          localStorage.setItem('lumora_user_profile', JSON.stringify(mapped));
        }
      } catch (e) {}
    }
  };

  // Called when registration is successful -> directs user immediately to Ev (Home)
  const handleSignUpSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('lumora_user_profile', JSON.stringify(user));
    } catch (e) {}
    if (user.id) {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          const mapped = mapProfileRowToUserProfile(data);
          if (user.firstName && (!mapped.firstName || mapped.firstName === 'İstifadəçi')) {
            mapped.firstName = user.firstName;
          }
          if (user.lastName && !mapped.lastName) {
            mapped.lastName = user.lastName;
          }
          setCurrentUser(mapped);
          localStorage.setItem('lumora_user_profile', JSON.stringify(mapped));
        }
      } catch (e) {}
    }
  };

  // Logout -> Düyməyə basılan kimi dərhal təmizlənir və Login açılır (gözləmədən)
  const handleLogout = () => {
    if (currentUser?.id && isUuid(currentUser.id)) {
      setUserOnlineStatus(currentUser.id, false).catch(console.warn);
    }
    try {
      localStorage.removeItem('lumora_user_profile');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    setCurrentUser(null);
    setCurrentScreen('login');

    // Arxa planda Supabase sessiyası bağlanır (gözləmədən)
    signOutUser().catch((err) => {
      console.warn('Supabase signOut error:', err);
    });
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

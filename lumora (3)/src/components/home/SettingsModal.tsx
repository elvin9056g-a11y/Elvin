import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  User,
  Bell,
  Moon,
  Globe,
  Bug,
  ShieldCheck,
  Info,
  LogOut,
  ChevronRight,
  Mail,
  Lock,
  Check,
  Send,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  FileText,
  HelpCircle,
  Smartphone,
  CreditCard,
  MessageCircle,
} from 'lucide-react';
import { Language, Translations, UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  t: Translations;
  onOpenProfileModal?: () => void;
  onLogout?: () => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
}

type SettingsView =
  | 'main'
  | 'profile'
  | 'language'
  | 'report_problem'
  | 'privacy_policy'
  | 'about_us'
  | 'change_name'
  | 'change_email'
  | 'change_password';

// Complete multi-language dictionary for all Settings screens
const settingsI18n = {
  az: {
    settings: 'Ayarlar',
    notifications: 'Bildirişlər',
    darkMode: 'Qaranlıq Rejim',
    language: 'Dil',
    selectLanguage: 'Dil Seçimi',
    reportProblem: 'Problemi Bildir',
    privacyPolicy: 'Məxfilik Siyasəti',
    aboutUs: 'Haqqımızda',
    logout: 'Çıxış Et',
    profile: 'Profil',
    user: 'İstifadəçi',
    email: 'Email',
    password: 'Şifrə',
    save: 'Yadda Saxla',
    send: 'Göndər',
    sent: 'Göndərildi!',
    firstName: 'Ad',
    lastName: 'Soyad',
    firstNamePlaceholder: 'Adınızı daxil edin',
    lastNamePlaceholder: 'Soyadınızı daxil edin',
    newEmail: 'Yeni Gmail Ünvanı',
    newEmailPlaceholder: 'yeni.email@gmail.com',
    currentEmail: 'Cari email:',
    sendCode: '4 Rəqəmli Kod Göndər',
    resendCode: 'Kodu yenidən göndər',
    verifyUpdate: 'Təsdiqlə və Yenilə',
    newPassword: 'Yeni Şifrə',
    newPasswordPlaceholder: 'Ən az 6 simvol',
    confirmPassword: 'Yeni Şifrənin Təkrarı',
    confirmPasswordPlaceholder: 'Şifrəni təkrar daxil edin',
    updatePassword: 'Şifrəni Yenilə',
    enterCodeDesc: 'ünvanına göndərilən 4 rəqəmli kod:',
    securityDesc: 'Təhlükəsizlik üçün cari email ünvanınıza 4 rəqəmli təsdiq kodu göndəriləcək.',
    problemPlaceholder: 'Şikayət, təklif və ya qarşılaşdığınız çətinliyi bura yazın...',
    problemPrompt: 'Qarşılaşdığınız problemi və ya təklifinizi ətraflı qeyd edin:',
    problemRecorded: 'Şikayətiniz qeydə alındı. Tezliklə araşdırılacaq!',
    nameUpdated: 'İstifadəçi adı uğurla yeniləndi!',
    emailUpdated: 'Email ünvanınız uğurla yeniləndi!',
    passwordUpdated: 'Şifrəniz uğurla yeniləndi!',
    codeSentToast: 'Gmail-ə 4 rəqəmli təsdiq kodu göndərildi:',
    wrongCode: '4 rəqəmli təsdiq kodu yanlışdır!',
    minPassword: 'Şifrə ən az 6 simvol olmalıdır!',
    mismatchPassword: 'Şifrələr bir-biri ilə uyğun gəlmir!',
    enterValidEmail: 'Düzgün email ünvanı qeyd edin',
    logoutConfirm: 'Hesabdan çıxmaq istədiyinizə əminsiniz?',
    idLabel: 'ID Kodunuz:',
    back: 'Geri',
    preferences: 'TƏNZİMLƏMƏLƏR',
    supportAndLegal: 'DƏSTƏK VƏ MƏLUMAT',
    categoryBug: 'Səhvlik',
    categorySuggestion: 'Təklif',
    categoryDesign: 'Dizayn',
    categoryOther: 'Digər',
  },
  en: {
    settings: 'Settings',
    notifications: 'Notifications',
    darkMode: 'Dark Mode',
    language: 'Language',
    selectLanguage: 'Select Language',
    reportProblem: 'Report a Problem',
    privacyPolicy: 'Privacy Policy',
    aboutUs: 'About Us',
    logout: 'Log Out',
    profile: 'Profile',
    user: 'User',
    email: 'Email',
    password: 'Password',
    save: 'Save',
    send: 'Send',
    sent: 'Sent!',
    firstName: 'First Name',
    lastName: 'Last Name',
    firstNamePlaceholder: 'Enter your first name',
    lastNamePlaceholder: 'Enter your last name',
    newEmail: 'New Gmail Address',
    newEmailPlaceholder: 'new.email@gmail.com',
    currentEmail: 'Current email:',
    sendCode: 'Send 4-Digit Code',
    resendCode: 'Resend code',
    verifyUpdate: 'Verify & Update',
    newPassword: 'New Password',
    newPasswordPlaceholder: 'At least 6 characters',
    confirmPassword: 'Confirm New Password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    updatePassword: 'Update Password',
    enterCodeDesc: '4-digit code sent to:',
    securityDesc: 'For security, a 4-digit verification code will be sent to your current email.',
    problemPlaceholder: 'Write your feedback, bug report, or complaint here...',
    problemPrompt: 'Describe the issue or suggestion in detail:',
    problemRecorded: 'Your report has been received. We will review it shortly!',
    nameUpdated: 'User name successfully updated!',
    emailUpdated: 'Email successfully updated!',
    passwordUpdated: 'Password successfully updated!',
    codeSentToast: '4-digit verification code sent to Gmail:',
    wrongCode: 'Invalid 4-digit verification code!',
    minPassword: 'Password must be at least 6 characters!',
    mismatchPassword: 'Passwords do not match!',
    enterValidEmail: 'Please enter a valid email address',
    logoutConfirm: 'Are you sure you want to log out?',
    idLabel: 'Your ID Code:',
    back: 'Back',
    preferences: 'PREFERENCES',
    supportAndLegal: 'SUPPORT & LEGAL',
    categoryBug: 'Bug',
    categorySuggestion: 'Suggestion',
    categoryDesign: 'Design',
    categoryOther: 'Other',
  },
  ru: {
    settings: 'Настройки',
    notifications: 'Уведомления',
    darkMode: 'Темный режим',
    language: 'Язык',
    selectLanguage: 'Выбор языка',
    reportProblem: 'Сообщить о проблеме',
    privacyPolicy: 'Политика конфиденциальности',
    aboutUs: 'О нас',
    logout: 'Выйти',
    profile: 'Профиль',
    user: 'Пользователь',
    email: 'Email',
    password: 'Пароль',
    save: 'Сохранить',
    send: 'Отправить',
    sent: 'Отправлено!',
    firstName: 'Имя',
    lastName: 'Фамилия',
    firstNamePlaceholder: 'Введите имя',
    lastNamePlaceholder: 'Введите фамилию',
    newEmail: 'Новый адрес Gmail',
    newEmailPlaceholder: 'new.email@gmail.com',
    currentEmail: 'Текущий email:',
    sendCode: 'Отправить 4-значный код',
    resendCode: 'Отправить код повторно',
    verifyUpdate: 'Подтвердить и обновить',
    newPassword: 'Новый пароль',
    newPasswordPlaceholder: 'Не менее 6 символов',
    confirmPassword: 'Подтвердите новый пароль',
    confirmPasswordPlaceholder: 'Повторите пароль',
    updatePassword: 'Обновить пароль',
    enterCodeDesc: '4-значный код, отправленный на:',
    securityDesc: 'В целях безопасности 4-значный проверочный код будет отправлен на ваш текущий email.',
    problemPlaceholder: 'Опишите проблему или предложение здесь...',
    problemPrompt: 'Подробно укажите проблему или предложение:',
    problemRecorded: 'Ваша жалоба принята. Мы скоро ее рассмотрим!',
    nameUpdated: 'Имя пользователя успешно обновлено!',
    emailUpdated: 'Email успешно обновлен!',
    passwordUpdated: 'Пароль успешно обновлен!',
    codeSentToast: '4-значный проверочный код отправлен на Gmail:',
    wrongCode: 'Неверный 4-значный проверочный код!',
    minPassword: 'Пароль должен содержать не менее 6 символов!',
    mismatchPassword: 'Пароли не совпадают!',
    enterValidEmail: 'Введите корректный email адрес',
    logoutConfirm: 'Вы уверены, что хотите выйти из аккаунта?',
    idLabel: 'Ваш ID код:',
    back: 'Назад',
    preferences: 'НАСТРОЙКИ',
    supportAndLegal: 'ПОДДЕРЖКА И ИНФО',
    categoryBug: 'Ошибка',
    categorySuggestion: 'Предложение',
    categoryDesign: 'Дизайн',
    categoryOther: 'Другое',
  },
  tr: {
    settings: 'Ayarlar',
    notifications: 'Bildirimler',
    darkMode: 'Karanlık Mod',
    language: 'Dil',
    selectLanguage: 'Dil Seçimi',
    reportProblem: 'Sorun Bildir',
    privacyPolicy: 'Gizlilik Politikası',
    aboutUs: 'Hakkımızda',
    logout: 'Çıkış Yap',
    profile: 'Profil',
    user: 'Kullanıcı',
    email: 'E-posta',
    password: 'Şifre',
    save: 'Kaydet',
    send: 'Gönder',
    sent: 'Gönderildi!',
    firstName: 'Ad',
    lastName: 'Soyad',
    firstNamePlaceholder: 'Adınızı girin',
    lastNamePlaceholder: 'Soyadınızı girin',
    newEmail: 'Yeni Gmail Adresi',
    newEmailPlaceholder: 'yeni.email@gmail.com',
    currentEmail: 'Mevcut e-posta:',
    sendCode: '4 Haneli Kod Gönder',
    resendCode: 'Kodu tekrar gönder',
    verifyUpdate: 'Doğrula ve Güncelle',
    newPassword: 'Yeni Şifre',
    newPasswordPlaceholder: 'En az 6 karakter',
    confirmPassword: 'Yeni Şifre Tekrarı',
    confirmPasswordPlaceholder: 'Şifreyi tekrar girin',
    updatePassword: 'Şifreyi Güncelle',
    enterCodeDesc: 'adresine gönderilen 4 haneli kod:',
    securityDesc: 'Güvenlik için mevcut e-posta adresinize 4 haneli onay kodu gönderilecektir.',
    problemPlaceholder: 'Şikayetinizi, önerinizi veya sorununuzu buraya yazın...',
    problemPrompt: 'Karşılaştığınız sorunu veya önerinizi detaylı olarak belirtin:',
    problemRecorded: 'Şikayetiniz kaydedildi. En kısa sürede incelenecektir!',
    nameUpdated: 'Kullanıcı adı başarıyla güncellendi!',
    emailUpdated: 'E-posta adresi başarıyla güncellendi!',
    passwordUpdated: 'Şifreniz başarıyla güncellendi!',
    codeSentToast: 'Gmail adresinize 4 haneli onay kodu gönderildi:',
    wrongCode: '4 haneli onay kodu hatalı!',
    minPassword: 'Şifre en az 6 karakter olmalıdır!',
    mismatchPassword: 'Şifreler birbiriyle uyuşmuyor!',
    enterValidEmail: 'Lütfen geçerli bir e-posta adresi girin',
    logoutConfirm: 'Hesaptan çıkış yapmak istediğinize emin misiniz?',
    idLabel: 'ID Kodunuz:',
    back: 'Geri',
    preferences: 'TERCİHLER',
    supportAndLegal: 'DESTEK VE BİLGİ',
    categoryBug: 'Hata',
    categorySuggestion: 'Öneri',
    categoryDesign: 'Tasarım',
    categoryOther: 'Diğer',
  },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentLanguage = 'az',
  onLanguageChange,
  t,
  onLogout,
  onUpdateProfile,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState<SettingsView>('main');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const loc = settingsI18n[currentLanguage] || settingsI18n.az;

  // Problem report state
  const [problemCategory, setProblemCategory] = useState<'bug' | 'suggestion' | 'design' | 'other'>('bug');
  const [problemText, setProblemText] = useState('');
  const [problemSuccess, setProblemSuccess] = useState(false);

  // Name change state
  const [editFirstName, setEditFirstName] = useState(currentUser.firstName || '');
  const [editLastName, setEditLastName] = useState(currentUser.lastName || '');

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('');
  const [enteredEmailOtp, setEnteredEmailOtp] = useState('');
  const [emailOtpError, setEmailOtpError] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [generatedPasswordOtp, setGeneratedPasswordOtp] = useState('');
  const [enteredPasswordOtp, setEnteredPasswordOtp] = useState('');
  const [passwordOtpError, setPasswordOtpError] = useState('');

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const languagesList: { code: Language; label: string; flag: string }[] = [
    { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  ];

  // Send 4-digit code to new email
  const handleSendEmailOtp = () => {
    if (!newEmail || !newEmail.includes('@')) {
      setEmailOtpError(loc.enterValidEmail);
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedEmailOtp(code);
    setEmailOtpSent(true);
    setEmailOtpError('');
    showToast(`${loc.codeSentToast} ${code}`);
  };

  // Verify and update email
  const handleVerifyEmail = () => {
    if (enteredEmailOtp !== generatedEmailOtp) {
      setEmailOtpError(loc.wrongCode);
      return;
    }
    if (onUpdateProfile) {
      onUpdateProfile({ email: newEmail });
    }
    showToast(loc.emailUpdated);
    setEmailOtpSent(false);
    setNewEmail('');
    setEnteredEmailOtp('');
    setActiveView('profile');
  };

  // Send 4-digit code for password update
  const handleSendPasswordOtp = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPasswordOtp(code);
    setPasswordOtpSent(true);
    setPasswordOtpError('');
    showToast(`${currentUser.email} -> ${loc.codeSentToast} ${code}`);
  };

  // Verify code and update password
  const handleVerifyPassword = () => {
    if (enteredPasswordOtp !== generatedPasswordOtp) {
      setPasswordOtpError(loc.wrongCode);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordOtpError(loc.minPassword);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordOtpError(loc.mismatchPassword);
      return;
    }
    showToast(loc.passwordUpdated);
    setPasswordOtpSent(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setEnteredPasswordOtp('');
    setActiveView('profile');
  };

  // Update user name
  const handleSaveName = () => {
    if (!editFirstName.trim()) return;
    if (onUpdateProfile) {
      onUpdateProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
      });
    }
    showToast(loc.nameUpdated);
    setActiveView('profile');
  };

  // Submit problem report
  const handleSubmitProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText.trim()) return;
    setProblemSuccess(true);
    setTimeout(() => {
      setProblemSuccess(false);
      setProblemText('');
      setActiveView('main');
      showToast(loc.problemRecorded);
    }, 1000);
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      if (window.confirm(loc.logoutConfirm)) {
        onClose();
        onLogout();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md overflow-hidden">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Settings Panel: Full-height on mobile, max-w-md / max-w-lg on desktop, seamless light/dark mode */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className={`relative z-10 w-full sm:max-w-md md:max-w-[480px] h-full sm:h-[90vh] sm:max-h-[860px] sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl transition-colors duration-300 border ${
          isDark
            ? 'bg-[#0f1219] text-white border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.85)]'
            : 'bg-[#f8f9fc] text-gray-900 border-gray-200/90 shadow-[0_20px_70px_rgba(0,0,0,0.14)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 left-4 right-4 z-50 py-2.5 px-4 rounded-2xl bg-emerald-500 text-white font-medium text-xs shadow-xl text-center flex items-center justify-center gap-2"
            >
              <Sparkles size={15} />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Sticky Header */}
        <div
          className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between shrink-0 transition-colors backdrop-blur-xl ${
            isDark
              ? 'bg-[#0f1219]/90 border-white/10'
              : 'bg-white/90 border-gray-200/80 shadow-xs'
          }`}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              if (activeView === 'main') {
                onClose();
              } else {
                setActiveView('main');
              }
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 text-white'
                : 'bg-black/5 hover:bg-black/10 text-gray-800'
            }`}
            title={loc.back}
          >
            <ArrowLeft size={19} />
          </button>

          {/* Title */}
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-center truncate">
            {activeView === 'main'
              ? loc.settings
              : activeView === 'profile'
              ? loc.profile
              : activeView === 'language'
              ? loc.selectLanguage
              : activeView === 'report_problem'
              ? loc.reportProblem
              : activeView === 'privacy_policy'
              ? loc.privacyPolicy
              : activeView === 'about_us'
              ? loc.aboutUs
              : activeView === 'change_name'
              ? loc.user
              : activeView === 'change_email'
              ? loc.email
              : loc.password}
          </h2>

          {/* Balance/Status subtle chip or placeholder */}
          <div className="w-9 h-9 flex items-center justify-center">
            {activeView === 'main' && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDark
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {currentLanguage.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
          {/* ========================================================= */}
          {/* 1. MAIN SETTINGS VIEW                                     */}
          {/* ========================================================= */}
          {activeView === 'main' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Profile Card (Sleek, integrated, no bulky box) */}
              <div
                onClick={() => setActiveView('profile')}
                className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 cursor-pointer transition-all duration-200 border group ${
                  isDark
                    ? 'bg-[#171a23] hover:bg-[#1d212c] border-white/10 shadow-sm'
                    : 'bg-white hover:bg-gray-50 border-gray-200/80 shadow-xs'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shrink-0 ring-2 shadow-xs ${
                    isDark
                      ? 'bg-white/10 ring-white/15 text-white'
                      : 'bg-gray-100 ring-gray-200 text-gray-700'
                  }`}
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="opacity-80" />
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate leading-snug">
                    {currentUser.firstName} {currentUser.lastName}
                  </h3>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      isDark ? 'text-white/60' : 'text-gray-500'
                    }`}
                  >
                    {currentUser.email}
                  </p>
                  <p className="text-[11px] font-mono text-emerald-500 dark:text-emerald-400 mt-0.5">
                    ID: {currentUser.userCode || '12345678'}
                  </p>
                </div>

                <ChevronRight
                  size={20}
                  className={`opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                />
              </div>

              {/* Preferences Section */}
              <div className="space-y-1.5">
                <span
                  className={`text-[11px] font-bold tracking-wider px-1 uppercase ${
                    isDark ? 'text-white/40' : 'text-gray-400'
                  }`}
                >
                  {loc.preferences}
                </span>

                <div
                  className={`rounded-2xl border divide-y overflow-hidden transition-colors ${
                    isDark
                      ? 'bg-[#171a23] border-white/10 divide-white/10'
                      : 'bg-white border-gray-200/80 divide-gray-100 shadow-xs'
                  }`}
                >
                  {/* Bildirişlər Row */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <Bell size={17} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">
                        {loc.notifications}
                      </span>
                    </div>

                    {/* Sleek Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center relative ${
                        notificationsEnabled ? 'bg-emerald-500' : isDark ? 'bg-white/20' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
                          notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Qaranlıq Rejim Row (Active and works seamlessly!) */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <Moon size={17} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">
                        {loc.darkMode}
                      </span>
                    </div>

                    {/* Sleek Toggle Switch for Dark Mode */}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center relative ${
                        isDark ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                      title={loc.darkMode}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
                          isDark ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dil (Language) Row */}
                  <div
                    onClick={() => setActiveView('language')}
                    className={`flex items-center justify-between p-3 cursor-pointer group transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <Globe size={17} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">
                        {loc.language}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          isDark
                            ? 'bg-white/10 border-white/10 text-white/80'
                            : 'bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                      >
                        {languagesList.find((l) => l.code === currentLanguage)?.flag}{' '}
                        {currentLanguage.toUpperCase()}
                      </span>
                      <ChevronRight
                        size={18}
                        className={`opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Support & Legal Section */}
              <div className="space-y-1.5">
                <span
                  className={`text-[11px] font-bold tracking-wider px-1 uppercase ${
                    isDark ? 'text-white/40' : 'text-gray-400'
                  }`}
                >
                  {loc.supportAndLegal}
                </span>

                <div
                  className={`rounded-2xl border divide-y overflow-hidden transition-colors ${
                    isDark
                      ? 'bg-[#171a23] border-white/10 divide-white/10'
                      : 'bg-white border-gray-200/80 divide-gray-100 shadow-xs'
                  }`}
                >
                  {/* Problemi Bildir */}
                  <div
                    onClick={() => setActiveView('report_problem')}
                    className={`flex items-center justify-between p-3 cursor-pointer group transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <Bug size={17} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">
                        {loc.reportProblem}
                      </span>
                    </div>
                    <ChevronRight
                      size={18}
                      className={`opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>

                  {/* Məxfilik Siyasəti */}
                  <div
                    onClick={() => setActiveView('privacy_policy')}
                    className={`flex items-center justify-between p-3 cursor-pointer group transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <ShieldCheck size={17} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">
                        {loc.privacyPolicy}
                      </span>
                    </div>
                    <ChevronRight
                      size={18}
                      className={`opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>

                  {/* Haqqımızda */}
                  <div
                    onClick={() => setActiveView('about_us')}
                    className={`flex items-center justify-between p-3 cursor-pointer group transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <Info size={17} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">
                        {loc.aboutUs}
                      </span>
                    </div>
                    <ChevronRight
                      size={18}
                      className={`opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Sleek Logout Button (Reduced thickness/height) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className={`w-full h-11 px-4 rounded-full font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-98 shadow-xs border ${
                    isDark
                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/25'
                      : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                  }`}
                >
                  <LogOut size={16} />
                  <span>{loc.logout}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. PROFILE VIEW (Clean, integrated, not bulky)            */}
          {/* ========================================================= */}
          {activeView === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Avatar Center */}
              <div className="flex flex-col items-center justify-center py-2">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden ring-4 shadow-md ${
                    isDark
                      ? 'bg-white/10 ring-white/15 text-white'
                      : 'bg-gray-100 ring-gray-200 text-gray-700'
                  }`}
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={38} className="opacity-80" />
                  )}
                </div>

                <h3 className="text-base font-semibold mt-2.5 text-center">
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                <p
                  className={`text-xs ${
                    isDark ? 'text-white/60' : 'text-gray-500'
                  }`}
                >
                  {currentUser.email}
                </p>
              </div>

              {/* Items Card: İstifadəçi, Email, Şifrə */}
              <div
                className={`rounded-2xl border divide-y overflow-hidden transition-colors ${
                  isDark
                    ? 'bg-[#171a23] border-white/10 divide-white/10'
                    : 'bg-white border-gray-200/80 divide-gray-100 shadow-xs'
                }`}
              >
                {/* 1. İstifadəçi Adı */}
                <div
                  onClick={() => {
                    setEditFirstName(currentUser.firstName);
                    setEditLastName(currentUser.lastName);
                    setActiveView('change_name');
                  }}
                  className={`p-3 flex items-center justify-between cursor-pointer group transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <User size={18} />
                    </div>
                    <div>
                      <p
                        className={`text-[11px] font-medium ${
                          isDark ? 'text-white/50' : 'text-gray-400'
                        }`}
                      >
                        {loc.user}
                      </p>
                      <p className="text-xs sm:text-sm font-semibold truncate">
                        {currentUser.firstName} {currentUser.lastName}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={`opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </div>

                {/* 2. Email */}
                <div
                  onClick={() => {
                    setNewEmail('');
                    setEmailOtpSent(false);
                    setEmailOtpError('');
                    setActiveView('change_email');
                  }}
                  className={`p-3 flex items-center justify-between cursor-pointer group transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <Mail size={18} />
                    </div>
                    <div>
                      <p
                        className={`text-[11px] font-medium ${
                          isDark ? 'text-white/50' : 'text-gray-400'
                        }`}
                      >
                        {loc.email}
                      </p>
                      <p className="text-xs sm:text-sm font-semibold truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={`opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </div>

                {/* 3. Şifrə */}
                <div
                  onClick={() => {
                    setPasswordOtpSent(false);
                    setPasswordOtpError('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setActiveView('change_password');
                  }}
                  className={`p-3 flex items-center justify-between cursor-pointer group transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <Lock size={18} />
                    </div>
                    <div>
                      <p
                        className={`text-[11px] font-medium ${
                          isDark ? 'text-white/50' : 'text-gray-400'
                        }`}
                      >
                        {loc.password}
                      </p>
                      <p className="text-xs sm:text-sm font-semibold tracking-widest">
                        ••••••••
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={`opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div
                className={`text-center text-xs pt-2 ${
                  isDark ? 'text-white/40' : 'text-gray-400'
                }`}
              >
                {loc.idLabel}{' '}
                <span className="font-mono font-semibold text-emerald-500 dark:text-emerald-400">
                  {currentUser.userCode || '12345678'}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. DİL SEÇİMİ (LANGUAGE SELECTION)                        */}
          {/* ========================================================= */}
          {activeView === 'language' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div
                className={`rounded-2xl border divide-y overflow-hidden transition-colors ${
                  isDark
                    ? 'bg-[#171a23] border-white/10 divide-white/10'
                    : 'bg-white border-gray-200/80 divide-gray-100 shadow-xs'
                }`}
              >
                {languagesList.map((lang) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onLanguageChange(lang.code);
                        showToast(`${lang.label}`);
                      }}
                      className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                            : 'bg-emerald-50 text-emerald-700 font-semibold'
                          : isDark
                          ? 'hover:bg-white/5'
                          : 'hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-xs sm:text-sm">{lang.label}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2
                          size={18}
                          className="text-emerald-500 dark:text-emerald-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. PROBLEMİ BİLDİR (HOME VIEW AESTHETIC)                   */}
          {/* ========================================================= */}
          {activeView === 'report_problem' && (
            <form
              onSubmit={handleSubmitProblem}
              className="space-y-3.5 animate-in fade-in duration-150"
            >
              <div
                className={`p-4 rounded-2xl border space-y-3 transition-colors ${
                  isDark
                    ? 'bg-[#171a23] border-white/10'
                    : 'bg-white border-gray-200/80 shadow-xs'
                }`}
              >
                <label className="block text-xs font-semibold">
                  {loc.problemPrompt}
                </label>

                {/* Categories */}
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'bug', label: loc.categoryBug },
                      { id: 'suggestion', label: loc.categorySuggestion },
                      { id: 'design', label: loc.categoryDesign },
                      { id: 'other', label: loc.categoryOther },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setProblemCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                        problemCategory === cat.id
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  placeholder={loc.problemPlaceholder}
                  className={`w-full h-36 rounded-xl p-3 text-xs sm:text-sm outline-none transition-all resize-none border ${
                    isDark
                      ? 'bg-white/5 focus:bg-white/10 border-white/15 focus:border-emerald-500 text-white placeholder-white/35'
                      : 'bg-black/[0.03] focus:bg-white border-black/10 focus:border-emerald-500 text-gray-900 placeholder-gray-400'
                  }`}
                  required
                />
              </div>

              {/* Submit Button (Sleek height, rounded-full) */}
              <button
                type="submit"
                disabled={problemSuccess}
                className={`w-full h-11 px-6 rounded-full font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-md border ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-emerald-400/30'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-600'
                }`}
              >
                {problemSuccess ? (
                  <>
                    <Check size={16} />
                    <span>{loc.sent}</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>{loc.send}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 5. MƏXFİLİK SİYASƏTİ (FULL INTEGRATED VIEW)              */}
          {/* ========================================================= */}
          {activeView === 'privacy_policy' && (
            <div className="space-y-3 animate-in fade-in duration-150 text-xs sm:text-[13px] leading-relaxed">
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-colors ${
                  isDark
                    ? 'bg-[#171a23] border-white/10'
                    : 'bg-white border-gray-200/80 shadow-xs'
                }`}
              >
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    Məxfilik Siyasəti və İstifadə Şərtləri
                  </h3>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      isDark ? 'text-white/50' : 'text-gray-400'
                    }`}
                  >
                    Son yenilənmə tarixi: 8 sentyabr 2026
                  </p>
                </div>

                <p className="opacity-90">
                  <strong className="text-emerald-500 dark:text-emerald-400 font-semibold">
                    Lumora
                  </strong>{' '}
                  olaraq istifadəçilərimizin təhlükəsizliyinə və məxfiliyinə böyük önəm veririk. Bu sənəd saytımızda qeydiyyatdan keçərkən, balansınızı artırarkən, kredit xidmətindən istifadə edərkən və ya daxili əməliyyatlar apararkən şəxsi və maliyyə məlumatlarınızın necə toplandığını, istifadə olunduğunu və qorunduğunu tənzimləyir.
                </p>

                <div className="space-y-1">
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    1. Toplanan Məlumatlar
                  </h4>
                  <p className="opacity-90">
                    Saytımızdakı xidmətlərdən tam yararlanmaq üçün sizdən aşağıdakı məlumatlar tələb oluna bilər:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 opacity-85 mt-1">
                    <li>
                      <strong>Qeydiyyat Məlumatları:</strong> Ad, soyad, e-poçt ünvanı, şifrə və sistem tərəfindən hər bir istifadəçiyə xüsusi olaraq təyin edilən unikal ID kodu.
                    </li>
                    <li>
                      <strong>Maliyyə Məlumatları:</strong> Balans artırma və ödəniş əməliyyatları zamanı istifadə olunan ödəniş vasitələri ilə bağlı zəruri tranzaksiya məlumatları (qeyd: birbaşa kart şifrələriniz sistemimizdə saxlanılmır, ödənişlər təhlükəsiz ödəniş şlüzləri vasitəsilə həyata keçirilir).
                    </li>
                    <li>
                      <strong>Fəaliyyət və Çat Məlumatları:</strong> Sayt daxilindəki şəxsi və qlobal çat bölmələrindəki yazışmalarınız, kredit tarixçəniz, aldığınız məhsullar və saytdaxili əməliyyat tarixçəniz.
                    </li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    2. Unikal ID Kodu və Təhlükəsizlik
                  </h4>
                  <p className="opacity-90">
                    Qeydiyyatdan keçən hər bir istifadəçiyə sistem tərəfindən fərdi ID kodu verilir. Bu ID kodu və hesabınızın təhlükəsizliyinə görə birbaşa istifadəçi məsuliyyət daşıyır. Hesab məlumatlarınızın üçüncü şəxslərlə paylaşılması qadağandır.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    3. Balans, Ödənişlər və Kredit Sistemi
                  </h4>
                  <p className="opacity-90">
                    <strong>Balansın artırılması:</strong> İstifadəçilər sayt daxilindəki əməliyyatlar üçün öz balanslarını artıra bilərlər.
                  </p>
                  <p className="opacity-90 mt-1">
                    <strong>Kredit sistemi:</strong> Sistem daxilində istifadəçilərə təklif olunan kredit xidmətləri şərtləri platformanın qaydalarına uyğun tənzimlənir. Kredit vasitəsilə əldə edilən vəsaitlər yalnız sayt daxilindəki xidmətlərin istifadəsi üçündür.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    4. Çat Bölməsi (Şəxsi və Qlobal)
                  </h4>
                  <p className="opacity-90">
                    Sayt daxilində təqdim olunan qlobal və şəxsi çat sistemləri ünsiyyət məqsədilə yaradılmışdır. Təhlükəsizliyin təmin edilməsi və qanunazidd əməliyyatların qarşısının alınması məqsədilə çat tarixçələri sistem tərəfindən qorunur, lakin üçüncü şəxslərə ötürülmür (qanuni hüquqi tələblər istisna olmaqla).
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-red-500 text-xs sm:text-sm">
                    5. Rəqəmsal Məhsulların və "Gizli Şeylərin" Satışı (Müəllif Hüquqları)
                  </h4>
                  <p className="opacity-90">
                    Saytdan əldə edilən rəqəmsal məhsullar, məlumatlar və ya "gizli şeylər" (xüsusi materiallar/kontentlər) yalnız alan istifadəçinin şəxsi istifadəsi üçündür.
                  </p>
                  <p className="text-red-500 dark:text-red-400 font-medium mt-1">
                    Qadağandır: Bu məhsulların istifadəçi tərəfindən başqasına satılması, başqasına verilməsi, kopyalanması və ya ictimai şəkildə paylaşılması qəti şəkildə qadağandır. Bu qaydanı pozan istifadəçilərin ID hesabı xəbərdarlıq edilmədən bloklana bilər və hüquqi tədbir görülə bilər.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    6. Məlumatların İstifadə Məqsədi
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 opacity-85">
                    <li>Hesabınızın və ID kodunuzun idarə edilməsi.</li>
                    <li>Ödənişlərin, balans artımlarının və kredit əməliyyatlarının həyata keçirilməsi.</li>
                    <li>Çat xidmətinin və saytın ümumi funksionallığının işlə təmin olunması.</li>
                    <li>Fırıldaqçılıq və təhlükəsizlik təhdidlərinin qarşısının alınması.</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-current/10">
                  <h4 className="font-semibold text-xs sm:text-sm">7. Əlaqə</h4>
                  <p className="opacity-90 mt-0.5">
                    Məxfilik Siyasəti və ya şərtlərlə bağlı suallarınız üçün bizimlə əlaqə saxlaya bilərsiniz:
                  </p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    E-poçt: elvin9056g@gmail.com
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. HAQQIMIZDA (ABOUT US - FULL INTEGRATED VIEW)            */}
          {/* ========================================================= */}
          {activeView === 'about_us' && (
            <div className="space-y-3 animate-in fade-in duration-150 text-xs sm:text-[13px] leading-relaxed">
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-colors ${
                  isDark
                    ? 'bg-[#171a23] border-white/10'
                    : 'bg-white border-gray-200/80 shadow-xs'
                }`}
              >
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    Lumora Haqqında
                  </h3>
                </div>

                <p className="opacity-90">
                  <strong className="text-emerald-500 dark:text-emerald-400 font-semibold">
                    Lumora
                  </strong>{' '}
                  olaraq məqsədimiz istifadəçilərimizə sürətli, etibarlı və funksional rəqəmsal mühit təqdim etməkdir. Platformamız hər bir istifadəçiyə xüsusi yanaşma sərgiləmək və rahat rəqəmsal təcrübə yaşatmaq üçün qurulmuşdur.
                </p>

                <div className="space-y-1.5">
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    Bizimlə Nə Əldə Edirsiniz?
                  </h4>
                  <ul className="space-y-1.5 opacity-90 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      <span>
                        <strong>Fərdi İdentifikasiya (ID Kodu):</strong> Qeydiyyatdan keçən hər bir istifadəçiyə verilən unikal ID kodu vasitəsilə sistemimizdə təhlükəsiz və rahat əməliyyatlar apara bilərsiniz.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      <span>
                        <strong>Rahat Balans və Kredit Sistemi:</strong> Balansınızı asanlıqla artıraraq daxili imkanlardan faydalana, ehtiyacınıza uyğun kredit imkanlarından yararlana bilərsiniz.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      <span>
                        <strong>Ünsiyyət (Çat Bölməsi):</strong> Qlobal və şəxsi çat sistemimiz vasitəsilə digər istifadəçilərlə əlaqə saxlaya və ünsiyyət qura bilərsiniz.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      <span>
                        <strong>Xüsusi Məhsullar və Xidmətlər:</strong> Platformamızda təqdim olunan eksklüziv və gizli rəqəmsal materiallardan faydalana bilərsiniz.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    Bizim Dəyərlərimiz
                  </h4>
                  <ul className="space-y-1.5 opacity-90 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      <span>
                        <strong>Təhlükəsizlik:</strong> İstifadəçilərimizin məlumatlarının və daxili balanslarının qorunması bizim üçün hər şeydən üstündür.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      <span>
                        <strong>Etibarlılıq:</strong> Şəffaf sistem prinsipləri ilə işləyir və hər bir istifadəçiyə bərabər şərait yaradırıq.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      <span>
                        <strong>İnkişaf:</strong> Platformamızı daimi olaraq yeniləyir, sizin təklifləriniz əsasında daha da təkmilləşdiririk.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-current/10">
                  <p className="opacity-90 font-medium">
                    Bizimlə birlikdə olduğunuz üçün təşəkkür edirik! Hər hansı sualınız, təklifiniz və ya çətinliyiniz olarsa, dəstək xəttimiz və ya əlaqə vasitələrimizlə hər zaman bizə müraciət edə bilərsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. İSTİFADƏÇİ ADINI DƏYİŞ (SIGN-UP AESTHETIC)             */}
          {/* ========================================================= */}
          {activeView === 'change_name' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div
                className={`p-4 rounded-2xl border space-y-3.5 transition-colors ${
                  isDark
                    ? 'bg-[#171a23] border-white/10'
                    : 'bg-white border-gray-200/80 shadow-xs'
                }`}
              >
                {/* Ad */}
                <div className="space-y-1">
                  <label
                    className={`block text-[11px] font-medium pl-2 ${
                      isDark ? 'text-white/80' : 'text-gray-800'
                    }`}
                  >
                    {loc.firstName}
                  </label>
                  <div className="relative flex items-center group">
                    <User
                      size={16}
                      className={`absolute left-3.5 pointer-events-none transition-colors ${
                        isDark ? 'text-white/70' : 'text-gray-600'
                      }`}
                    />
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder={loc.firstNamePlaceholder}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-full text-xs sm:text-sm outline-none transition-all border shadow-inner ${
                        isDark
                          ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                          : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Soyad */}
                <div className="space-y-1">
                  <label
                    className={`block text-[11px] font-medium pl-2 ${
                      isDark ? 'text-white/80' : 'text-gray-800'
                    }`}
                  >
                    {loc.lastName}
                  </label>
                  <div className="relative flex items-center group">
                    <User
                      size={16}
                      className={`absolute left-3.5 pointer-events-none transition-colors ${
                        isDark ? 'text-white/70' : 'text-gray-600'
                      }`}
                    />
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder={loc.lastNamePlaceholder}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-full text-xs sm:text-sm outline-none transition-all border shadow-inner ${
                        isDark
                          ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                          : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button (Sleek, rounded-full) */}
              <button
                type="button"
                onClick={handleSaveName}
                className={`w-full h-11 px-6 rounded-full font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-md border ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-emerald-400/30'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-600'
                }`}
              >
                <Check size={16} />
                <span>{loc.save}</span>
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 8. EMAIL DƏYİŞ (SIGN-UP AESTHETIC + 4 RƏQƏMLİ KOD)        */}
          {/* ========================================================= */}
          {activeView === 'change_email' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div
                className={`p-4 rounded-2xl border space-y-3.5 transition-colors ${
                  isDark
                    ? 'bg-[#171a23] border-white/10'
                    : 'bg-white border-gray-200/80 shadow-xs'
                }`}
              >
                <p
                  className={`text-xs ${
                    isDark ? 'text-white/70' : 'text-gray-600'
                  }`}
                >
                  {loc.currentEmail}{' '}
                  <span className="font-semibold text-emerald-500 dark:text-emerald-400">
                    {currentUser.email}
                  </span>
                </p>

                {!emailOtpSent ? (
                  <div className="space-y-1">
                    <label
                      className={`block text-[11px] font-medium pl-2 ${
                        isDark ? 'text-white/80' : 'text-gray-800'
                      }`}
                    >
                      {loc.newEmail}
                    </label>
                    <div className="relative flex items-center group">
                      <Mail
                        size={16}
                        className={`absolute left-3.5 pointer-events-none transition-colors ${
                          isDark ? 'text-white/70' : 'text-gray-600'
                        }`}
                      />
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder={loc.newEmailPlaceholder}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-full text-xs sm:text-sm outline-none transition-all border shadow-inner ${
                          isDark
                            ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                            : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      className={`block text-[11px] font-medium text-center ${
                        isDark ? 'text-white/80' : 'text-gray-800'
                      }`}
                    >
                      <span className="font-semibold text-emerald-500">
                        {newEmail}
                      </span>{' '}
                      {loc.enterCodeDesc}
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={enteredEmailOtp}
                      onChange={(e) => setEnteredEmailOtp(e.target.value)}
                      placeholder="••••"
                      className={`w-full h-12 rounded-2xl text-center tracking-[12px] font-mono text-xl outline-none transition-all border ${
                        isDark
                          ? 'bg-white/10 border-white/20 focus:border-emerald-400 text-white'
                          : 'bg-black/[0.04] border-black/15 focus:border-emerald-500 text-gray-900'
                      }`}
                    />
                  </div>
                )}

                {emailOtpError && (
                  <p className="text-xs text-red-400 text-center font-medium">
                    {emailOtpError}
                  </p>
                )}
              </div>

              {!emailOtpSent ? (
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  className={`w-full h-11 px-6 rounded-full font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-md border ${
                    isDark
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-emerald-400/30'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-600'
                  }`}
                >
                  <Mail size={16} />
                  <span>{loc.sendCode}</span>
                </button>
              ) : (
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    className={`flex-1 h-11 rounded-full text-xs font-semibold border transition-colors ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                    }`}
                  >
                    {loc.resendCode}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    className="flex-1 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-md active:scale-98 transition-transform"
                  >
                    {loc.verifyUpdate}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 9. ŞİFRƏ DƏYİŞ (SIGN-UP AESTHETIC + 4 RƏQƏMLİ KOD)        */}
          {/* ========================================================= */}
          {activeView === 'change_password' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div
                className={`p-4 rounded-2xl border space-y-3.5 transition-colors ${
                  isDark
                    ? 'bg-[#171a23] border-white/10'
                    : 'bg-white border-gray-200/80 shadow-xs'
                }`}
              >
                <p
                  className={`text-xs ${
                    isDark ? 'text-white/70' : 'text-gray-600'
                  }`}
                >
                  {loc.securityDesc}
                </p>

                {!passwordOtpSent ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSendPasswordOtp}
                      className={`w-full h-11 px-6 rounded-full font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-md border ${
                        isDark
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-emerald-400/30'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-600'
                      }`}
                    >
                      <Lock size={16} />
                      <span>{loc.sendCode}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 4-digit code */}
                    <div className="space-y-1.5">
                      <label
                        className={`block text-[11px] font-medium text-center ${
                          isDark ? 'text-white/80' : 'text-gray-800'
                        }`}
                      >
                        <span className="font-semibold text-emerald-500">
                          {currentUser.email}
                        </span>{' '}
                        {loc.enterCodeDesc}
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={enteredPasswordOtp}
                        onChange={(e) => setEnteredPasswordOtp(e.target.value)}
                        placeholder="••••"
                        className={`w-full h-11 rounded-2xl text-center tracking-[12px] font-mono text-xl outline-none transition-all border ${
                          isDark
                            ? 'bg-white/10 border-white/20 focus:border-emerald-400 text-white'
                            : 'bg-black/[0.04] border-black/15 focus:border-emerald-500 text-gray-900'
                        }`}
                      />
                    </div>

                    {/* New password */}
                    <div className="space-y-1">
                      <label
                        className={`block text-[11px] font-medium pl-2 ${
                          isDark ? 'text-white/80' : 'text-gray-800'
                        }`}
                      >
                        {loc.newPassword}
                      </label>
                      <div className="relative flex items-center group">
                        <Lock
                          size={16}
                          className={`absolute left-3.5 pointer-events-none transition-colors ${
                            isDark ? 'text-white/70' : 'text-gray-600'
                          }`}
                        />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={loc.newPasswordPlaceholder}
                          className={`w-full pl-10 pr-10 py-2.5 rounded-full text-xs sm:text-sm outline-none transition-all border shadow-inner ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                              : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1">
                      <label
                        className={`block text-[11px] font-medium pl-2 ${
                          isDark ? 'text-white/80' : 'text-gray-800'
                        }`}
                      >
                        {loc.confirmPassword}
                      </label>
                      <div className="relative flex items-center group">
                        <Lock
                          size={16}
                          className={`absolute left-3.5 pointer-events-none transition-colors ${
                            isDark ? 'text-white/70' : 'text-gray-600'
                          }`}
                        />
                        <input
                          type={showConfirmNewPassword ? 'text' : 'password'}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder={loc.confirmPasswordPlaceholder}
                          className={`w-full pl-10 pr-10 py-2.5 rounded-full text-xs sm:text-sm outline-none transition-all border shadow-inner ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/[0.13] focus:bg-white/15 border-white/20 focus:border-white/50 text-white placeholder-white/40'
                              : 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white border-black/15 focus:border-black/40 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          className="absolute right-3.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                        >
                          {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {passwordOtpError && (
                      <p className="text-xs text-red-400 text-center font-medium">
                        {passwordOtpError}
                      </p>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleVerifyPassword}
                        className={`w-full h-11 px-6 rounded-full font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-md border ${
                          isDark
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-emerald-400/30'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-600'
                        }`}
                      >
                        <Check size={16} />
                        <span>{loc.updatePassword}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

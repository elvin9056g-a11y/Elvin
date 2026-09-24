import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Headphones,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Search,
  Palette,
  Video,
  Layout,
  Home as HomeIcon,
  ShoppingBag,
  CreditCard,
  Settings,
  MessageCircle,
  Star,
  User,
  Info,
} from 'lucide-react';
import { UserProfile, ServiceItem, Language, Translations } from '../../types';
import { translations } from '../../data/translations';
import { useTheme } from '../../context/ThemeContext';
import { ProfileCardModal } from './ProfileCardModal';
import { LiveSupportDrawer } from './LiveSupportDrawer';
import { AdInquiryModal } from './AdInquiryModal';
import { SettingsModal } from './SettingsModal';
import { ChatModal } from '../chat/ChatModal';
import { StoreView } from '../store/StoreView';

interface HomeViewProps {
  currentUser: UserProfile;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
  t?: Translations;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onLogout?: () => void;
  onNavigateToAuth?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  currentLanguage = 'az',
  onLanguageChange,
  t,
  onUpdateProfile,
  onLogout,
}) => {
  const { isDark } = useTheme();
  const currentT = t || translations[currentLanguage || 'az'];

  // Modals & Panels state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'design'>('all');

  // Interactive Toast notice state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // 5 Dedicated Design Services dynamically localized
  const servicesList: ServiceItem[] = [
    {
      id: 'srv_graphic',
      title: currentT.services.graphic.title,
      category: 'design',
      categoryLabel: currentT.services.graphic.category,
      price: currentT.services.graphic.price,
      rating: 4.9,
      reviewsCount: 342,
      iconName: 'palette',
      description: currentT.services.graphic.desc,
    },
    {
      id: 'srv_motion',
      title: currentT.services.motion.title,
      category: 'design',
      categoryLabel: currentT.services.motion.category,
      price: currentT.services.motion.price,
      rating: 4.8,
      reviewsCount: 228,
      iconName: 'video',
      description: currentT.services.motion.desc,
    },
    {
      id: 'srv_web',
      title: currentT.services.web.title,
      category: 'design',
      categoryLabel: currentT.services.web.category,
      price: currentT.services.web.price,
      rating: 5.0,
      reviewsCount: 310,
      iconName: 'layout',
      description: currentT.services.web.desc,
    },
    {
      id: 'srv_interior',
      title: currentT.services.interior.title,
      category: 'design',
      categoryLabel: currentT.services.interior.category,
      price: currentT.services.interior.price,
      rating: 4.9,
      reviewsCount: 165,
      iconName: 'home',
      description: currentT.services.interior.desc,
    },
    {
      id: 'srv_logo',
      title: currentT.services.logo.title,
      category: 'design',
      categoryLabel: currentT.services.logo.category,
      price: currentT.services.logo.price,
      rating: 4.9,
      reviewsCount: 420,
      iconName: 'sparkles',
      description: currentT.services.logo.desc,
    },
  ];

  // Filtered services
  const filteredServices = servicesList.filter((srv) => {
    const matchesSearch =
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || srv.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const userDisplayId =
    currentUser.userCode ||
    (currentUser.id
      ? currentUser.id.replace(/\D/g, '').substring(0, 8) || '12345678'
      : '12345678');

  const renderServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'palette':
        return <Palette size={20} className={isDark ? 'text-cyan-400' : 'text-cyan-600'} />;
      case 'video':
        return <Video size={20} className={isDark ? 'text-purple-400' : 'text-purple-600'} />;
      case 'layout':
        return <Layout size={20} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />;
      case 'home':
        return <HomeIcon size={20} className={isDark ? 'text-amber-400' : 'text-amber-600'} />;
      case 'sparkles':
      default:
        return <Sparkles size={20} className={isDark ? 'text-pink-400' : 'text-pink-600'} />;
    }
  };

  if (isStoreOpen) {
    return (
      <StoreView
        currentUser={currentUser}
        onBackToHome={() => setIsStoreOpen(false)}
        onUpdateProfile={onUpdateProfile}
      />
    );
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-between pb-24 sm:pb-28 transition-colors duration-300 relative ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 z-50 px-4 py-2.5 rounded-full border shadow-xl text-xs font-semibold backdrop-blur-xl flex items-center gap-2 ${
              isDark
                ? 'bg-[#1e2029]/95 border-white/20 text-white'
                : 'bg-white/95 border-gray-300 text-gray-950 shadow-lg'
            }`}
          >
            <Info size={16} className="text-cyan-500 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Responsive Container */}
      <main className="w-full max-w-md sm:max-w-xl lg:max-w-2xl px-4 sm:px-6 pt-3 sm:pt-6 space-y-4">
        {/* ========================================================= */}
        {/* 1. TOP HEADER: Profile Pill (Left) & Live Support (Right) */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Profile Card Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsProfileModalOpen(true)}
            aria-label={currentT.home.userProfileAria}
            className={`group px-3.5 py-2 rounded-[20px] transition-all text-left flex items-center gap-3 cursor-pointer ${
              isDark ? 'text-white' : 'text-gray-950'
            }`}
            style={
              isDark
                ? {
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    boxShadow:
                      '0 8px 32px 0 rgba(0, 0, 0, 0.25), inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)',
                  }
                : {
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    boxShadow:
                      '0 6px 20px 0 rgba(0, 0, 0, 0.06), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
                  }
            }
          >
            {/* User Avatar with Frosted Ring */}
            <div
              className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md ring-2 ${
                isDark
                  ? 'border border-white/50 bg-gray-700 ring-white/20'
                  : 'border border-gray-300 bg-gray-200 ring-gray-200'
              }`}
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={`${currentUser.firstName} ${currentUser.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={18} className={isDark ? 'text-white' : 'text-gray-700'} />
              )}
            </div>

            {/* User Name & ID */}
            <div className="pr-1.5">
              <div
                className={`text-xs font-bold tracking-tight truncate max-w-[130px] sm:max-w-[160px] ${
                  isDark ? 'text-white' : 'text-gray-950'
                }`}
              >
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div
                className={`text-[10px] font-semibold ${
                  isDark ? 'text-white/65' : 'text-gray-500'
                }`}
              >
                {currentT.profile.idLabel}: {userDisplayId}
              </div>
            </div>
          </motion.button>

          {/* Live Support Headphones Button with Online Pulsing Dot */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSupportDrawerOpen(true)}
            aria-label={currentT.home.liveSupport}
            className={`relative w-11 h-11 rounded-full border backdrop-blur-xl flex items-center justify-center cursor-pointer shadow-md transition-all ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'
            }`}
            title={currentT.home.liveSupport}
          >
            <Headphones size={20} />
            {/* Online Green Pulsing Indicator */}
            <span className="absolute bottom-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white"></span>
            </span>
          </motion.button>
        </div>

        {/* ========================================================= */}
        {/* 2. REKLAM MƏRKƏZİ HERO BANNER                             */}
        {/* ========================================================= */}
        <div
          className={`relative overflow-hidden rounded-[32px] p-5 sm:p-6 border backdrop-blur-2xl transition-all duration-300 shadow-xl ${
            isDark
              ? 'bg-gradient-to-br from-[#12343d]/80 via-[#0d222b]/80 to-[#101924]/90 border-cyan-500/25 shadow-[0_15px_40px_rgba(6,182,212,0.12)]'
              : 'bg-gradient-to-br from-[#d7f3fb] via-[#e2f7fd] to-[#eef9fd] border-cyan-200/90 shadow-[0_15px_35px_rgba(6,182,212,0.1)] text-gray-950'
          }`}
        >
          {/* Subtle Ambient Light Reflections */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 -mb-8 w-32 h-32 bg-blue-500/15 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            {/* Pill Tag */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md shadow-sm text-[10px] font-extrabold tracking-wider uppercase ${
                isDark
                  ? 'bg-white/15 border-white/25 text-cyan-200'
                  : 'bg-white/95 border-cyan-300 text-cyan-900'
              }`}
            >
              <Sparkles size={12} className={isDark ? 'text-cyan-300' : 'text-cyan-600'} />
              <span>{currentT.home.adBadge}</span>
            </div>

            {/* Title */}
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isDark ? 'text-white' : 'text-gray-950'
              }`}
            >
              {currentT.home.adTitle}
            </h2>

            {/* Description */}
            <p
              className={`text-xs sm:text-[13px] leading-relaxed max-w-md ${
                isDark ? 'text-white/80' : 'text-gray-700 font-semibold'
              }`}
            >
              {currentT.home.adDesc}
            </p>

            {/* Action Row */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsAdModalOpen(true)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-white text-gray-950 hover:bg-gray-100'
                    : 'bg-gray-950 text-white hover:bg-gray-800'
                }`}
              >
                <span>{currentT.home.applyNow}</span>
                <ArrowUpRight size={15} />
              </motion.button>

              <span
                className={`text-[11px] font-semibold ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}
              >
                {currentT.home.auditIncluded}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. AI SÜNİ İNTELLEKTİNİZ ROW                             */}
        {/* ========================================================= */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => showToast(currentT.home.aiTitle)}
          className={`px-4 py-3 rounded-full border backdrop-blur-xl flex items-center justify-between cursor-pointer transition-all shadow-md ${
            isDark
              ? 'bg-white/10 hover:bg-white/15 border-white/15'
              : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Black AI Circle Badge */}
            <div className="w-10 h-10 rounded-full bg-gray-950 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-inner">
              AI
            </div>
            <span
              className={`text-xs sm:text-sm font-bold ${
                isDark ? 'text-white' : 'text-gray-950'
              }`}
            >
              {currentT.home.aiTitle}
            </span>
          </div>

          {/* Right Arrow Circle */}
          <div
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
              isDark
                ? 'border-white/20 text-white/80 group-hover:bg-white/10'
                : 'border-gray-300 text-gray-700 group-hover:bg-gray-100'
            }`}
          >
            <ArrowRight size={15} />
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* 4. XİDMƏTLƏR (SERVICES) SECTION                           */}
        {/* ========================================================= */}
        <div className="space-y-3 pt-2">
          {/* Section Title with Badge Count */}
          <div className="flex items-center gap-2">
            <h3
              className={`text-lg sm:text-xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-gray-950'
              }`}
            >
              {currentT.home.servicesTitle}
            </h3>
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border ${
                isDark
                  ? 'bg-white/10 border-white/15 text-white/80'
                  : 'bg-gray-100 border-gray-300 text-gray-800'
              }`}
            >
              {filteredServices.length}
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-50">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentT.home.searchPlaceholder}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border backdrop-blur-md transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                isDark
                  ? 'bg-white/5 border-white/15 text-white placeholder-white/40'
                  : 'bg-white border-gray-300 text-gray-950 placeholder-gray-400 shadow-sm'
              }`}
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-gray-950 dark:bg-white text-white dark:text-black shadow-md'
                  : isDark
                  ? 'bg-white/10 text-white/70 hover:bg-white/15'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm'
              }`}
            >
              {currentT.home.tabAll}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('design')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'design'
                  ? 'bg-gray-950 dark:bg-white text-white dark:text-black shadow-md'
                  : isDark
                  ? 'bg-white/10 text-white/70 hover:bg-white/15'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm'
              }`}
            >
              {currentT.home.tabDesign}
            </button>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {filteredServices.map((service) => (
              <motion.div
                key={service.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  showToast(currentT.home.orderSoonToast.replace('{title}', service.title))
                }
                className={`p-4 rounded-[26px] border backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between group ${
                  isDark
                    ? 'bg-[#151720]/80 hover:bg-[#1a1d28]/90 border-white/10 hover:border-cyan-500/40 text-white shadow-black/20'
                    : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-cyan-400 text-gray-950 shadow-[0_4px_16px_rgba(0,0,0,0.04)]'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Bar of Service Card */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
                        isDark
                          ? 'bg-white/5 border-white/10'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {renderServiceIcon(service.iconName || 'sparkles')}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white/70'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                    >
                      {service.categoryLabel}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-sm font-bold tracking-tight line-clamp-1 group-hover:text-cyan-500 transition-colors">
                      {service.title}
                    </h4>
                    <p
                      className={`text-[11px] leading-relaxed line-clamp-2 mt-1 ${
                        isDark ? 'text-white/60' : 'text-gray-600'
                      }`}
                    >
                      {service.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Price, Rating & Arrow */}
                <div className="pt-3 mt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black tracking-tight text-cyan-600 dark:text-cyan-400">
                      {service.price}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] mt-0.5 opacity-70">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span>{service.rating}</span>
                      <span>({service.reviewsCount})</span>
                    </div>
                  </div>

                  {/* Arrow circle */}
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-sm transition-colors ${
                      isDark
                        ? 'border-white/20 text-white/80 group-hover:border-cyan-400 group-hover:text-cyan-300'
                        : 'border-gray-200 bg-gray-50 text-gray-800 group-hover:border-cyan-400 group-hover:text-cyan-600'
                    }`}
                  >
                    <ArrowUpRight size={15} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="py-8 text-center text-xs opacity-60">
              {currentT.home.noServicesFound}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* 5. BOTTOM NAVIGATION BAR / DOCK                           */}
      {/* ========================================================= */}
      <div className="fixed bottom-3 sm:bottom-5 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none flex justify-center">
        <nav
          style={{
            background: isDark ? 'rgba(16, 24, 38, 0.42)' : 'rgba(255, 255, 255, 0.32)',
            backdropFilter: 'blur(30px) saturate(190%)',
            WebkitBackdropFilter: 'blur(30px) saturate(190%)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.22)'
              : '1px solid rgba(255, 255, 255, 0.65)',
            boxShadow: isDark
              ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.35), 0 12px 40px rgba(0, 0, 0, 0.5)'
              : 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.95), 0 12px 35px rgba(0, 0, 0, 0.08)',
          }}
          className="pointer-events-auto w-full max-w-md sm:max-w-lg rounded-[28px] sm:rounded-3xl transition-all duration-300"
        >
          <div className="px-6 py-2.5 flex items-center justify-between relative">
            {/* 1. Ev (Active with dot indicator) */}
            <button
              type="button"
              className="flex flex-col items-center gap-1 cursor-pointer select-none group"
              aria-label={currentT.home.navHome}
            >
              <div
                className={`p-2 rounded-2xl ${
                  isDark ? 'text-white' : 'text-gray-950'
                }`}
              >
                <HomeIcon size={22} />
              </div>
              {/* Active Indicator Dot */}
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-white' : 'bg-gray-950'
                }`}
              />
            </button>

            {/* 2. Mesajlar / Çat with Badge 1 */}
            <button
              type="button"
              onClick={() => setIsChatModalOpen(true)}
              className="flex flex-col items-center gap-1 cursor-pointer relative select-none group"
              aria-label={currentT.home.navSupport}
            >
              <div
                className={`p-2 rounded-2xl relative transition-all ${
                  isDark
                    ? 'text-white/60 hover:text-white group-hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-950 group-hover:bg-gray-100'
                }`}
              >
                <MessageCircle size={22} />
                {/* Red Unread Notification Badge */}
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  1
                </span>
              </div>
            </button>

            {/* 3. MAĞAZA - Elevated Center Circle Button */}
            <div className="relative -top-4 flex flex-col items-center select-none">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsStoreOpen(true)}
                className={`w-14 h-14 rounded-full border-2 shadow-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDark
                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 border-white text-white shadow-[0_10px_30px_rgba(6,182,212,0.4)]'
                    : 'bg-gradient-to-tr from-gray-950 to-gray-800 border-white text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]'
                }`}
                aria-label={currentT.home.navShop}
              >
                <ShoppingBag size={20} />
                <span className="text-[8px] font-black tracking-widest mt-0.5">
                  {currentT.home.navShop}
                </span>
              </motion.button>
            </div>

            {/* 4. Balans / Kart */}
            <button
              type="button"
              onClick={() =>
                showToast(
                  currentT.home.balanceToast.replace(
                    '{amount}',
                    currentUser.balance.toFixed(2)
                  )
                )
              }
              className={`flex flex-col items-center gap-1 cursor-pointer select-none group ${
                isDark ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-950'
              }`}
              aria-label={currentT.home.navBalance}
            >
              <div
                className={`p-2 rounded-2xl transition-all ${
                  isDark ? 'group-hover:bg-white/5' : 'group-hover:bg-gray-100'
                }`}
              >
                <CreditCard size={22} />
              </div>
            </button>

            {/* 5. Tənzimləmələr / Settings (Opens SettingsModal) */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className={`flex flex-col items-center gap-1 cursor-pointer select-none group ${
                isDark ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-950'
              }`}
              aria-label={currentT.home.navSettings}
            >
              <div
                className={`p-2 rounded-2xl transition-all ${
                  isDark ? 'group-hover:bg-white/5' : 'group-hover:bg-gray-100'
                }`}
              >
                <Settings size={22} />
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* ========================================================= */}
      {/* MODALS & PANELS                                           */}
      {/* ========================================================= */}

      {/* Profile Card Modal (Şəkil 1 with True Glassmorphism) */}
      <ProfileCardModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onUpdateProfile={onUpdateProfile}
        t={currentT}
      />

      {/* Live Support Drawer (Canlı Dəstək) */}
      <LiveSupportDrawer
        isOpen={isSupportDrawerOpen}
        onClose={() => setIsSupportDrawerOpen(false)}
        userName={`${currentUser.firstName} ${currentUser.lastName}`}
        t={currentT}
      />

      {/* Şəxsi və Qlobal Çat Modalı (Screenshots match) */}
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUserName={`${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Siz'}
        currentLanguage={currentLanguage}
      />

      {/* Reklam Mərkəzi Application Modal */}
      <AdInquiryModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        currentUser={currentUser}
        t={currentT}
      />

      {/* Ayarlar / Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange || (() => {})}
        t={currentT}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onLogout={onLogout}
        onUpdateProfile={onUpdateProfile}
      />
    </div>
  );
};

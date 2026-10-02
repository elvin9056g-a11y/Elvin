import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Ticket,
  Percent,
  Calendar,
  Users,
  User,
  Sparkles,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  Infinity as InfinityIcon,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { supabase, savePromocodeToDb, searchProfiles } from '../../lib/supabase';
import { DbPromocode, UserProfile } from '../../types';

interface PromocodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingPromocode?: DbPromocode | null;
}

export const PromocodeEditModal: React.FC<PromocodeEditModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingPromocode,
}) => {
  // Form fields
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number | string>(20);
  const [isUnlimitedUsage, setIsUnlimitedUsage] = useState(true);
  const [usageLimit, setUsageLimit] = useState<number | string>('');
  const [isNoExpiry, setIsNoExpiry] = useState(true);
  const [expiresAtDate, setExpiresAtDate] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  // User target selection (Hamı üçün vs Şəxsi)
  const [targetType, setTargetType] = useState<'all' | 'personal'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([]);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);

  // Status & Feedback
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize or reset form based on editingPromocode
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setUserSearchQuery('');
      setUserSearchResults([]);
      setIsUserDropdownOpen(false);

      if (editingPromocode) {
        setCode(editingPromocode.code || '');
        setDiscountPercent(editingPromocode.discount_percent || 20);
        setIsActive(editingPromocode.is_active ?? true);

        // Usage limit
        if (typeof editingPromocode.usage_limit === 'number' && editingPromocode.usage_limit > 0) {
          setIsUnlimitedUsage(false);
          setUsageLimit(editingPromocode.usage_limit);
        } else {
          setIsUnlimitedUsage(true);
          setUsageLimit('');
        }

        // Expiry date
        if (editingPromocode.expires_at) {
          setIsNoExpiry(false);
          // format to YYYY-MM-DD for date input
          const dt = new Date(editingPromocode.expires_at);
          if (!isNaN(dt.getTime())) {
            const formatted = dt.toISOString().split('T')[0];
            setExpiresAtDate(formatted);
          } else {
            setIsNoExpiry(true);
            setExpiresAtDate('');
          }
        } else {
          setIsNoExpiry(true);
          setExpiresAtDate('');
        }

        // User target (Hamı üçün vs Şəxsi)
        if (editingPromocode.user_id) {
          setTargetType('personal');
          if (editingPromocode.profiles) {
            setSelectedUser({
              id: editingPromocode.profiles.id,
              userCode: editingPromocode.profiles.user_code || undefined,
              firstName: editingPromocode.profiles.first_name || 'İstifadəçi',
              lastName: editingPromocode.profiles.last_name || '',
              email: editingPromocode.profiles.email || '',
              avatarUrl: editingPromocode.profiles.avatar || undefined,
              balance: 0,
            });
          } else {
            // Load profile by id
            supabase
              .from('profiles')
              .select('*')
              .eq('id', editingPromocode.user_id)
              .maybeSingle()
              .then(({ data }) => {
                if (data) {
                  setSelectedUser({
                    id: data.id,
                    userCode: data.user_code,
                    firstName: data.first_name || 'İstifadəçi',
                    lastName: data.last_name || '',
                    email: data.email || '',
                    avatarUrl: data.avatar,
                    balance: data.balance || 0,
                  });
                }
              });
          }
        } else {
          setTargetType('all');
          setSelectedUser(null);
        }
      } else {
        // Defaults for new promocode
        setCode('');
        setDiscountPercent(20);
        setIsUnlimitedUsage(true);
        setUsageLimit('');
        setIsNoExpiry(true);
        setExpiresAtDate('');
        setIsActive(true);
        setTargetType('all');
        setSelectedUser(null);
      }
    }
  }, [isOpen, editingPromocode]);

  // Click outside listener for user search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search profiles when typing
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const results = await searchProfiles(userSearchQuery);
        setUserSearchResults(results);
        setIsUserDropdownOpen(true);
      } catch (err) {
        console.warn('Search profiles error:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Generate random promo code
  const handleGenerateRandomCode = () => {
    const prefixes = ['LUMORA', 'SPECIAL', 'SALE', 'DISCOUNT', 'VIP', 'BONUS', 'PREMIUM', 'YAZ', 'YENI'];
    const discounts = [10, 15, 20, 25, 30, 40, 50];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const chosenDiscount = discounts[Math.floor(Math.random() * discounts.length)];
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const newCode = `${prefix}${chosenDiscount > 0 ? chosenDiscount : randomSuffix}`;
    setCode(newCode);
    setDiscountPercent(chosenDiscount);
  };

  // Preset percentage buttons
  const percentagePresets = [10, 20, 25, 30, 50, 70];

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Zəhmət olmasa promokod daxil edin.');
      return;
    }

    const discountVal = Number(discountPercent);
    if (isNaN(discountVal) || discountVal < 1 || discountVal > 100) {
      setErrorMsg('Endirim faizi 1 ilə 100 arasında olmalıdır.');
      return;
    }

    let parsedUsageLimit: number | null = null;
    if (!isUnlimitedUsage) {
      const parsed = parseInt(String(usageLimit), 10);
      if (isNaN(parsed) || parsed <= 0) {
        setErrorMsg('İstifadə limiti müsbət tam ədəd olmalıdır və ya "Limitsiz" seçilməlidir.');
        return;
      }
      parsedUsageLimit = parsed;
    }

    let parsedExpiresAt: string | null = null;
    if (!isNoExpiry) {
      if (!expiresAtDate) {
        setErrorMsg('Son istifadə tarixini seçin və ya "Müddətsiz" qeyd edin.');
        return;
      }
      // Set to end of that selected day (23:59:59 UTC/Local)
      parsedExpiresAt = new Date(`${expiresAtDate}T23:59:59`).toISOString();
    }

    // Target user id
    const targetUserId = targetType === 'personal' && selectedUser?.id ? selectedUser.id : null;
    if (targetType === 'personal' && !targetUserId) {
      setErrorMsg('Zəhmət olmasa şəxsi promokod üçün istifadəçi seçin və ya "Hamı üçün" növünü təyin edin.');
      return;
    }

    setSaving(true);
    try {
      const res = await savePromocodeToDb({
        id: editingPromocode?.id,
        code: cleanCode,
        discount_percent: discountVal,
        is_active: isActive,
        user_id: targetUserId,
        usage_limit: parsedUsageLimit,
        expires_at: parsedExpiresAt,
      });

      if (!res.success) {
        throw new Error(res.error || 'Promokod bazaya yazıla bilmədi.');
      }

      setSuccessMsg('Promokod uğurla yadda saxlanıldı!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 600);
    } catch (err: any) {
      console.error('Save promocode error:', err);
      if (err.message && err.message.includes('unique') || err.message.includes('code')) {
        setErrorMsg('Bu adda promokod artıq mövcuddur. Zəhmət olmasa başqa kod daxil edin.');
      } else {
        setErrorMsg(err.message || 'Xəta baş verdi. Zəhmət olmasa təkrar cəhd edin.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden bg-[#11131a] border border-white/15 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
              <Ticket size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                {editingPromocode ? 'Promokodu Redaktə Et' : 'Yeni Promokod Yarat'}
              </h2>
              <p className="text-xs text-white/60">
                Endirim faizi, istifadə limiti və şəxsi kod təyinatı
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/15 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Promokod Kodu (Text) + Avtomatik Yarat */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                <Ticket size={14} className="text-cyan-400" />
                <span>Promokod</span>
                <span className="text-rose-400">*</span>
              </label>

              <button
                type="button"
                onClick={handleGenerateRandomCode}
                className="px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Təsadüfi promokod yarat"
              >
                <Sparkles size={12} className="text-amber-300" />
                <span>Avtomatik Yarat</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                placeholder="Məs: YENI20 və ya LUMORA50"
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-mono font-bold tracking-wider uppercase bg-white/5 border border-white/15 text-cyan-300 placeholder-white/35 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              {code && (
                <button
                  type="button"
                  onClick={() => setCode('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Endirim Faizi (Number 1-100) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                <Percent size={14} className="text-cyan-400" />
                <span>Endirim Faizi (%)</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {discountPercent}% ENDİRİM
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="20"
                  className="w-full pl-4 pr-10 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white/5 border border-white/15 text-white placeholder-white/35 focus:outline-none focus:border-cyan-400 transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-white/40 text-xs">
                  %
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                {percentagePresets.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      Number(discountPercent) === pct
                        ? 'bg-cyan-500 text-gray-950 font-black shadow-md shadow-cyan-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: İstifadə Limiti (Number / Limitsiz) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                <InfinityIcon size={14} className="text-cyan-400" />
                <span>İstifadə Limiti</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isUnlimitedUsage}
                  onChange={(e) => {
                    setIsUnlimitedUsage(e.target.checked);
                    if (e.target.checked) setUsageLimit('');
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 accent-cyan-400 cursor-pointer"
                />
                <span className={isUnlimitedUsage ? 'text-cyan-300 font-bold' : ''}>
                  Limitsiz istifadə
                </span>
              </label>
            </div>

            {!isUnlimitedUsage ? (
              <input
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Məs: 50 nəfər"
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium bg-white/5 border border-white/15 text-white placeholder-white/35 focus:outline-none focus:border-cyan-400 transition-all"
              />
            ) : (
              <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-cyan-300 font-medium flex items-center gap-2">
                <InfinityIcon size={15} />
                <span>Bu kod hər kəs tərəfindən limitsiz sayda istifadə oluna bilər.</span>
              </div>
            )}
          </div>

          {/* Section 4: Son İstifadə Tarixi (Date Picker / Müddətsiz) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                <Calendar size={14} className="text-cyan-400" />
                <span>Son İstifadə Tarixi</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isNoExpiry}
                  onChange={(e) => {
                    setIsNoExpiry(e.target.checked);
                    if (e.target.checked) setExpiresAtDate('');
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 accent-cyan-400 cursor-pointer"
                />
                <span className={isNoExpiry ? 'text-cyan-300 font-bold' : ''}>
                  Müddətsiz (Son tarix yoxdur)
                </span>
              </label>
            </div>

            {!isNoExpiry ? (
              <input
                type="date"
                value={expiresAtDate}
                onChange={(e) => setExpiresAtDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium bg-white/5 border border-white/15 text-white focus:outline-none focus:border-cyan-400 transition-all [color-scheme:dark]"
              />
            ) : (
              <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-emerald-300 font-medium flex items-center gap-2">
                <Calendar size={15} />
                <span>Bu kodun son istifadə tarixi yoxdur (Daimi aktiv qalacaq).</span>
              </div>
            )}
          </div>

          {/* Section 5: Şəxsi Kod (User Search / Select) */}
          <div className="space-y-2.5 pt-1">
            <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
              <Users size={14} className="text-cyan-400" />
              <span>Promokodun Təyinatı (Növü)</span>
            </label>

            {/* Target Type Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setTargetType('all');
                  setSelectedUser(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  targetType === 'all'
                    ? 'bg-cyan-500 text-gray-950 shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>Hamı üçün (Ümumi)</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('personal')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  targetType === 'personal'
                    ? 'bg-cyan-500 text-gray-950 shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <User size={14} />
                <span>Şəxsi (Müəyyən istifadəçi)</span>
              </button>
            </div>

            {/* If Personal selected: User Search and Selection */}
            {targetType === 'personal' && (
              <div className="space-y-2 pt-1" ref={userSearchRef}>
                {selectedUser ? (
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {selectedUser.avatarUrl ? (
                        <img
                          src={selectedUser.avatarUrl}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {selectedUser.firstName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-white truncate">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </h5>
                          {selectedUser.userCode && (
                            <span className="font-mono text-[10px] text-cyan-300 font-bold bg-cyan-500/15 px-1.5 py-0.2 rounded border border-cyan-500/30">
                              #{selectedUser.userCode}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/60 truncate font-mono">
                          {selectedUser.email || selectedUser.id}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Dəyişdir
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        setIsUserDropdownOpen(true);
                      }}
                      onFocus={() => setIsUserDropdownOpen(true)}
                      placeholder="İstifadəçinin adı, emaili və ya 8 rəqəmli ID-si ilə axtar..."
                      className="w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs bg-white/5 border border-white/15 text-white placeholder-white/35 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                    {searchingUsers && (
                      <RefreshCw
                        size={14}
                        className="animate-spin text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2"
                      />
                    )}

                    {/* Search Dropdown */}
                    <AnimatePresence>
                      {isUserDropdownOpen && userSearchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-48 overflow-y-auto rounded-2xl bg-[#161922] border border-white/15 shadow-2xl p-1.5 space-y-1"
                        >
                          {userSearchResults.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setIsUserDropdownOpen(false);
                                setUserSearchQuery('');
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-cyan-500/15 text-left transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {u.avatarUrl ? (
                                  <img
                                    src={u.avatarUrl}
                                    alt=""
                                    className="w-7 h-7 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center text-xs font-bold">
                                    {u.firstName.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white truncate">
                                      {u.firstName} {u.lastName}
                                    </span>
                                    {u.userCode && (
                                      <span className="text-[10px] font-mono text-cyan-300">
                                        #{u.userCode}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-white/50 truncate block">
                                    {u.email}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
                                Seç
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 6: Status - Aktivdir (Checkbox / Toggle) */}
          <div className="pt-2 border-t border-white/10">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/10 cursor-pointer select-none">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  <span>Promokod Aktivdir</span>
                </span>
                <p className="text-[11px] text-white/50">
                  Deaktiv edildikdə istifadəçilər bu kodu səbətdə tətbiq edə bilməyəcək.
                </p>
              </div>

              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded-md border-white/30 bg-white/10 text-cyan-500 accent-cyan-400 cursor-pointer"
              />
            </label>
          </div>

          {/* Modal Bottom Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
            >
              İmtina
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Yadda saxlanılır...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Yadda Saxla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

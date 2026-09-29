import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Building2,
  User,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { AdInquiry, UserProfile, Translations } from '../../types';
import { translations } from '../../data/translations';
import {
  COUNTRY_PHONE_LIST,
  CountryPhone,
  formatPhoneDigits,
} from '../../data/countryPhoneCodes';

interface AdInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  t?: Translations;
}

export const AdInquiryModal: React.FC<AdInquiryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  t,
}) => {
  const { isDark } = useTheme();
  const adT = t?.adModal || translations.az.adModal;

  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [companyName, setCompanyName] = useState(currentUser?.company || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<AdInquiry | null>(null);

  // Country phone state
  const [selectedCountry, setSelectedCountry] = useState<CountryPhone>(COUNTRY_PHONE_LIST[0]);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCountryOpen(false);
      }
    };
    if (isCountryOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCountryOpen]);

  if (!isOpen) return null;

  // Filter countries by search query (including aliases, English, and local names)
  const query = countrySearch.trim().toLowerCase();
  const filteredCountries = COUNTRY_PHONE_LIST.filter((c) => {
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      c.dialCode.includes(query) ||
      c.code.toLowerCase().includes(query) ||
      (c.altNames && c.altNames.some((alt) => alt.toLowerCase().includes(query)))
    );
  });

  // Handle phone digit typing with strict length capping
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const onlyDigits = rawVal.replace(/\D/g, '');

    // Strictly forbid entering more digits than the country's limit
    if (onlyDigits.length > selectedCountry.digits) {
      return;
    }

    setPhoneDigits(onlyDigits);
    if (phoneError) setPhoneError(null);
  };

  // Change country and re-clamp digits
  const handleSelectCountry = (country: CountryPhone) => {
    setSelectedCountry(country);
    setIsCountryOpen(false);
    setCountrySearch('');
    // If current digits exceed new country's limit, slice to match
    if (phoneDigits.length > country.digits) {
      setPhoneDigits(phoneDigits.slice(0, country.digits));
    }
    if (phoneError) setPhoneError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Strict validation: cannot be fewer than required
    if (phoneDigits.length !== selectedCountry.digits) {
      setPhoneError(
        `Nömrə tam deyil. ${selectedCountry.name} üçün ${selectedCountry.digits} rəqəm olmalıdır (hazırda: ${phoneDigits.length}/${selectedCountry.digits}).`
      );
      return;
    }

    setLoading(true);

    const fullPhone = `${selectedCountry.dialCode} ${formatPhoneDigits(
      phoneDigits,
      selectedCountry.mask
    )}`;

    const inquiryId = 'RM-' + Math.floor(10000 + Math.random() * 90000);
    const newInquiry: AdInquiry = {
      id: inquiryId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      companyName: companyName.trim(),
      phone: fullPhone,
      email: email.trim(),
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Save to local storage for persistence
    try {
      const stored = localStorage.getItem('lumora_ad_inquiries');
      const list = stored ? JSON.parse(stored) : [];
      list.push(newInquiry);
      localStorage.setItem('lumora_ad_inquiries', JSON.stringify(list));
    } catch (err) {
      console.warn('Could not save inquiry to localStorage', err);
    }

    setTimeout(() => {
      setLoading(false);
      setSubmittedInquiry(newInquiry);
    }, 600);
  };

  const handleReset = () => {
    setSubmittedInquiry(null);
    setPhoneDigits('');
    setPhoneError(null);
    onClose();
  };

  const formattedDisplay = formatPhoneDigits(phoneDigits, selectedCountry.mask);
  const isComplete = phoneDigits.length === selectedCountry.digits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={handleReset} />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative z-10 w-full max-w-lg rounded-[32px] border overflow-hidden shadow-2xl p-6 sm:p-8 transition-all ${
          isDark
            ? 'bg-[#151720]/95 border-white/20 text-white'
            : 'bg-white/95 border-black/15 text-gray-900'
        }`}
        style={{
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleReset}
          aria-label={adT.close}
          className={`absolute top-5 right-5 w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
            isDark
              ? 'border-white/10 hover:bg-white/10 text-white/70'
              : 'border-gray-200 hover:bg-gray-100 text-gray-700'
          }`}
        >
          <X size={18} />
        </button>

        <AnimatePresence mode="wait">
          {!submittedInquiry ? (
            /* Inquiry Submission Form */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="space-y-1 pr-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                  <Sparkles size={13} />
                  <span>REKLAM</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
                  {adT.title}
                </h2>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? 'text-white/60' : 'text-gray-600'
                  }`}
                >
                  {adT.subtitle}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
                {/* Ad və Soyad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block text-[11px] font-semibold mb-1 ${
                        isDark ? 'text-white/80' : 'text-gray-700'
                      }`}
                    >
                      {adT.firstName}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Elvin"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs border bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all ${
                          isDark
                            ? 'border-white/15 text-white placeholder-white/30'
                            : 'border-gray-300 text-gray-900 placeholder-gray-400 bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-[11px] font-semibold mb-1 ${
                        isDark ? 'text-white/80' : 'text-gray-700'
                      }`}
                    >
                      {adT.lastName}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Səmədov"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs border bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all ${
                          isDark
                            ? 'border-white/15 text-white placeholder-white/30'
                            : 'border-gray-300 text-gray-900 placeholder-gray-400 bg-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Şirkət Adı */}
                <div>
                  <label
                    className={`block text-[11px] font-semibold mb-1 ${
                      isDark ? 'text-white/80' : 'text-gray-700'
                    }`}
                  >
                    {adT.company}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                      <Building2 size={15} />
                    </div>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={adT.company}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs border bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all ${
                        isDark
                          ? 'border-white/15 text-white placeholder-white/30'
                          : 'border-gray-300 text-gray-900 placeholder-gray-400 bg-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Əlaqə Nömrəsi (Ölkə seçimi və dəqiq rəqəm sayı məhdudiyyəti) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      className={`text-[11px] font-semibold ${
                        isDark ? 'text-white/80' : 'text-gray-700'
                      }`}
                    >
                      {adT.phone}
                    </label>
                    {/* Digit count indicator: nə artıq, nə də az */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                        isComplete
                          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-400 font-bold'
                          : 'border-white/15 bg-white/5 text-white/60'
                      }`}
                    >
                      {phoneDigits.length} / {selectedCountry.digits}{' '}
                      {isComplete ? '✓' : 'rəqəm'}
                    </span>
                  </div>

                  <div className="flex items-stretch gap-2 relative">
                    {/* Country Selector Trigger Button */}
                    <div ref={countryDropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCountryOpen(!isCountryOpen)}
                        className={`h-full px-3 py-2.5 rounded-2xl border text-xs flex items-center gap-1.5 cursor-pointer transition-all select-none ${
                          isDark
                            ? 'border-white/20 bg-white/10 hover:bg-white/15 text-white'
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-900'
                        }`}
                        title="Ölkəni dəyiş"
                      >
                        <span className="text-base leading-none">{selectedCountry.flag}</span>
                        <span className="font-semibold text-xs">{selectedCountry.dialCode}</span>
                        <ChevronDown size={14} className="opacity-60" />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {isCountryOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-h-72 rounded-2xl border shadow-2xl overflow-hidden z-50 flex flex-col ${
                              isDark
                                ? 'bg-[#1a1c26] border-white/20 text-white'
                                : 'bg-white border-gray-200 text-gray-900 shadow-xl'
                            }`}
                            style={{
                              backdropFilter: 'blur(20px)',
                            }}
                          >
                            {/* Search Bar */}
                            <div className="p-2 border-b border-white/10 sticky top-0 bg-inherit z-10">
                              <div className="relative">
                                <Search
                                  size={13}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50"
                                />
                                <input
                                  ref={searchInputRef}
                                  type="text"
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  placeholder="Ölkə axtar..."
                                  className={`w-full pl-7 pr-2.5 py-1.5 text-xs rounded-xl border bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                                    isDark
                                      ? 'border-white/15 text-white placeholder-white/40'
                                      : 'border-gray-300 text-gray-900 placeholder-gray-400'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Country list */}
                            <div className="overflow-y-auto flex-1 p-1">
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleSelectCountry(c)}
                                    className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer text-left ${
                                      selectedCountry.code === c.code
                                        ? 'bg-cyan-500/20 text-cyan-400 font-semibold'
                                        : isDark
                                        ? 'hover:bg-white/10 text-white/90'
                                        : 'hover:bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate pr-2">
                                      <span className="text-base">{c.flag}</span>
                                      <span className="truncate">{c.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 text-[11px] opacity-75">
                                      <span className="font-mono">{c.dialCode}</span>
                                      <span className="text-[10px] opacity-60">
                                        ({c.digits} rəqəm)
                                      </span>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 text-center text-xs opacity-50">
                                  Ölkə tapılmadı
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Phone Number Input (Numbers only, strictly capped) */}
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                        <Phone size={15} />
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        required
                        value={formattedDisplay}
                        onChange={handlePhoneChange}
                        placeholder={selectedCountry.example}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs font-mono tracking-wide border bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all ${
                          phoneError
                            ? 'border-red-400/80 ring-1 ring-red-400/50'
                            : isDark
                            ? 'border-white/15 text-white placeholder-white/30'
                            : 'border-gray-300 text-gray-900 placeholder-gray-400 bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {phoneError ? (
                    <p className="mt-1 text-[11px] text-red-400 font-medium">
                      {phoneError}
                    </p>
                  ) : (
                    <p
                      className={`mt-1 text-[10px] ${
                        isDark ? 'text-white/50' : 'text-gray-500'
                      }`}
                    >
                      {selectedCountry.name} nömrəsi üçün dəqiq {selectedCountry.digits} rəqəm
                      yazılmalıdır (məsələn: {selectedCountry.example}).
                    </p>
                  )}
                </div>

                {/* Email Ünvanı */}
                <div>
                  <label
                    className={`block text-[11px] font-semibold mb-1 ${
                      isDark ? 'text-white/80' : 'text-gray-700'
                    }`}
                  >
                    {adT.email}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="elvin9056g@gmail.com"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs border bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all ${
                        isDark
                          ? 'border-white/15 text-white placeholder-white/30'
                          : 'border-gray-300 text-gray-900 placeholder-gray-400 bg-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Əlavə Qeyd */}
                <div>
                  <label
                    className={`block text-[11px] font-semibold mb-1 ${
                      isDark ? 'text-white/80' : 'text-gray-700'
                    }`}
                  >
                    {adT.notes}
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={adT.notes}
                    className={`w-full px-3 py-2 rounded-2xl text-xs border bg-transparent focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all resize-none ${
                      isDark
                        ? 'border-white/15 text-white placeholder-white/30'
                        : 'border-gray-300 text-gray-900 placeholder-gray-400 bg-white'
                    }`}
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={15} />
                        <span>{adT.submitBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* Confirmation Receipt Screen */
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-4 text-center space-y-4 select-none"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shadow-lg">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-xl font-bold tracking-tight text-gray-950 dark:text-white">
                  {adT.successMsg}
                </h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold">
                  <span>Sorğu ID: #{submittedInquiry.id}</span>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border text-left text-xs space-y-2 ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                <div className="flex justify-between">
                  <span className="opacity-60">{adT.firstName} / {adT.lastName}:</span>
                  <span className="font-semibold">
                    {submittedInquiry.firstName} {submittedInquiry.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">{adT.company}:</span>
                  <span className="font-semibold">
                    {submittedInquiry.companyName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">{adT.phone}:</span>
                  <span className="font-semibold">{submittedInquiry.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">{adT.email}:</span>
                  <span className="font-semibold">{submittedInquiry.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 px-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer active:scale-98"
              >
                {adT.close}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

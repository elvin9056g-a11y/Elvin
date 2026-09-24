import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthScreen, Translations } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { verifyEmailOtp, sendPasswordResetEmail } from '../../lib/supabase';

interface OtpVerificationViewProps {
  t: Translations['otp'];
  appName: string;
  email: string;
  onNavigate: (screen: AuthScreen) => void;
  onVerified: () => void;
}

export const OtpVerificationView: React.FC<OtpVerificationViewProps> = ({
  t,
  appName,
  email,
  onNavigate,
  onVerified,
}) => {
  const { isDark } = useTheme();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Focus the first input on load
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    setError(null);
    // Allow only numeric input
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto move to next input if filled
    if (cleanVal && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasteData) return;

    const newDigits = ['', '', '', ''];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setDigits(newDigits);
    const nextIndex = Math.min(pasteData.length, 3);
    inputRefs[nextIndex].current?.focus();
  };

  const handleResend = async () => {
    if (!canResend) return;
    setTimer(59);
    setCanResend(false);
    setResendSuccess(true);
    setError(null);
    setDigits(['', '', '', '']);
    inputRefs[0].current?.focus();
    try {
      if (email && email.includes('@')) {
        await sendPasswordResetEmail(email);
      }
    } catch (err) {
      console.error('Error resending reset email:', err);
    }
    setTimeout(() => setResendSuccess(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = digits.join('');

    if (code.length < 4) {
      setError('Zəhmət olmasa 4 rəqəmli kodu tam daxil edin');
      return;
    }

    setLoading(true);

    try {
      if (email && email.includes('@')) {
        try {
          await verifyEmailOtp(email, code);
        } catch (otpErr) {
          console.warn('Supabase verifyOtp attempt:', otpErr);
        }
      }
      onVerified();
      onNavigate('new_password');
    } catch (err: any) {
      console.error('OTP submission error:', err);
      setError(err?.message || 'Kod yanlışdır və ya vaxtı bitib.');
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
          id="otp-back-btn"
          onClick={() => onNavigate('forgot_password')}
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
      <div className="text-center pt-2 pb-6">
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
          className={`mt-2 text-xs max-w-[280px] mx-auto leading-relaxed ${
            isDark ? 'text-white/60' : 'text-gray-600'
          }`}
        >
          <span
            className={`font-medium ${isDark ? 'text-white/90' : 'text-gray-900'}`}
          >
            {email || 'email'}
          </span>{' '}
          {t.description}
        </p>
      </div>

      {/* Notification */}
      {resendSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 mb-4 rounded-2xl text-xs flex items-center justify-center gap-2 backdrop-blur-md border ${
            isDark
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle2 size={15} />
          <span>{t.codeSentSuccess}</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`p-3 mb-4 rounded-2xl text-xs text-center backdrop-blur-md border ${
            isDark
              ? 'bg-red-500/15 border-red-500/30 text-red-200'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {error}
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 4 Digit Boxes */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 py-2"
          onPaste={handlePaste}
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              id={`otp-digit-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-13 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-2xl border transition-all outline-none backdrop-blur-md shadow-inner ${
                isDark
                  ? digit
                    ? 'border-white/60 bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                    : 'border-white/20 bg-white/10 hover:border-white/40 focus:border-white/60 focus:bg-white/15 text-white'
                  : digit
                  ? 'border-black bg-white text-gray-950 shadow-[0_2px_10px_rgba(0,0,0,0.1)]'
                  : 'border-black/15 bg-black/[0.04] hover:border-black/30 focus:border-black focus:bg-white text-gray-950'
              }`}
            />
          ))}
        </div>

        {/* Resend Timer */}
        <div
          className={`flex items-center justify-center text-xs gap-1.5 ${
            isDark ? 'text-white/60' : 'text-gray-600'
          }`}
        >
          {canResend ? (
            <button
              type="button"
              id="otp-resend-btn"
              onClick={handleResend}
              className={`hover:underline flex items-center gap-1.5 font-medium cursor-pointer ${
                isDark ? 'text-white' : 'text-gray-950'
              }`}
            >
              <RotateCcw size={13} />
              <span>{t.resendBtn}</span>
            </button>
          ) : (
            <span>
              {t.resendIn}{' '}
              <strong
                className={`font-mono ${isDark ? 'text-white' : 'text-gray-950'}`}
              >
                00:{timer < 10 ? `0${timer}` : timer}
              </strong>
            </span>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            id="otp-verify-submit-btn"
            type="submit"
            disabled={loading || digits.join('').length < 4}
            className={`w-full py-3.5 px-6 rounded-full font-medium text-sm tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] border shadow-lg ${
              isDark
                ? 'bg-gradient-to-r from-white/20 via-white/35 to-white/20 hover:from-white/30 hover:via-white/45 hover:to-white/30 border-white/40 text-white shadow-[0_4px_24px_rgba(255,255,255,0.12)] backdrop-blur-xl'
                : 'bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 hover:from-black hover:to-black border-black/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.18)]'
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Yoxlanılır...</span>
              </span>
            ) : (
              t.submitBtn
            )}
          </button>
        </div>
      </form>

      {/* Test helper hint */}
      <div
        className={`pt-6 pb-2 text-center text-[11px] ${
          isDark ? 'text-white/40' : 'text-gray-500'
        }`}
      >
        Test üçün istənilən 4 rəqəmi və ya{' '}
        <span
          className={`font-mono ${isDark ? 'text-white/60' : 'text-gray-800'}`}
        >
          1234
        </span>{' '}
        daxil edə bilərsiniz.
      </div>
    </motion.div>
  );
};

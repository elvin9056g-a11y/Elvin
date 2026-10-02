import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, X, CreditCard, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface BalanceTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onSuccess?: (amount: number) => void;
}

export const BalanceTopUpModal: React.FC<BalanceTopUpModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const [selectedAmount, setSelectedAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay'>('card');
  const [cardNumber, setCardNumber] = useState('4169 •••• •••• 8820');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmount <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      const newBalance = Number((currentUser.balance + currentAmount).toFixed(2));
      onUpdateProfile({ balance: newBalance });
      setIsProcessing(false);
      setIsSuccess(true);
      if (onSuccess) onSuccess(currentAmount);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isProcessing && onClose()}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-5 sm:p-6 z-10 backdrop-blur-2xl ${
            isDark
              ? 'bg-[#12141c]/95 border-white/15 text-white'
              : 'bg-white/95 border-gray-200 text-gray-900'
          }`}
        >
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-lg font-extrabold text-emerald-400">
                Balans Uğurla Artırıldı!
              </h4>
              <p className="text-xs opacity-75">
                +{currentAmount.toFixed(2)} AZN hesabınıza əlavə olundu. Cari balans:{' '}
                <span className="font-bold text-white">
                  {(currentUser.balance + currentAmount).toFixed(2)} AZN
                </span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleTopUp} className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Wallet size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold">
                      Balansı Artır
                    </h3>
                    <p className="text-[11px] opacity-65">
                      Cari Balans: {currentUser.balance.toFixed(2)} AZN
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Amount Selection */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase opacity-75">
                  Artırılacaq Məbləğ
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        !customAmount && selectedAmount === amt
                          ? 'bg-cyan-500 border-cyan-400 text-white shadow-md'
                          : isDark
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                          : 'bg-gray-100 border-gray-200 text-gray-800'
                      }`}
                    >
                      {amt} ₼
                    </button>
                  ))}
                </div>

                {/* Custom Amount input */}
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Digər məbləğ daxil edin (AZN)"
                  className="w-full px-3 py-2 rounded-xl border bg-black/20 text-xs focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase opacity-75">
                  Ödəniş Metodu
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400'
                        : 'border-white/10 bg-white/5 opacity-70'
                    }`}
                  >
                    <CreditCard size={16} />
                    <span className="text-xs font-bold">Bank Kartı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('apple_pay')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'apple_pay'
                        ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400'
                        : 'border-white/10 bg-white/5 opacity-70'
                    }`}
                  >
                    <ShieldCheck size={16} />
                    <span className="text-xs font-bold">Apple / Google Pay</span>
                  </button>
                </div>
              </div>

              {/* Card preview if card selected */}
              {paymentMethod === 'card' && (
                <div className="p-3 rounded-xl border bg-black/30 border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between items-center opacity-80">
                    <span className="text-[10px] uppercase font-bold">Yadda saxlanılmış kart</span>
                    <span className="text-[10px] font-bold text-cyan-400">Visa / Mastercard</span>
                  </div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border bg-black/40 text-xs font-mono"
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isProcessing || currentAmount <= 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Ödəniş icra olunur...</span>
                ) : (
                  <>
                    <span>Ödənişi Tamamla (+{currentAmount.toFixed(2)} ₼)</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

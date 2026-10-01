import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  CheckCircle2,
  X,
  Wallet,
  Tag,
  Download,
  Key,
  ExternalLink,
  Copy,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { CartItem, StoreProduct, UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface CartViewProps {
  items: CartItem[];
  currentUser: UserProfile;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenProduct: (product: StoreProduct) => void;
  onGoToCatalog: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenTopUp: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  items,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenProduct,
  onGoToCatalog,
  onUpdateProfile,
  onOpenTopUp,
}) => {
  const { isDark } = useTheme();

  // Promo kod state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Alış tamamlandı state
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasedKeys, setPurchasedKeys] = useState<{
    productName: string;
    key: string;
    downloadUrl: string;
  }[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const PROMO_CODES: Record<string, number> = {
    LUMORA20: 20,
    ENDIRIM10: 10,
    BONUS50: 50,
    YAZ2026: 15,
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoInput.trim().toUpperCase();
    if (!cleanCode) return;

    if (PROMO_CODES[cleanCode]) {
      setAppliedPromo({
        code: cleanCode,
        discountPercent: PROMO_CODES[cleanCode],
      });
      setPromoError(null);
    } else {
      setPromoError('Daxil etdiyiniz promo kod yanlışdır.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
  };

  // Qiymət hesablamaları
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const promoDiscountAmount = appliedPromo
    ? (subtotal * appliedPromo.discountPercent) / 100
    : 0;

  const total = Math.max(0, subtotal - promoDiscountAmount);
  const hasEnoughBalance = currentUser.balance >= total;
  const missingBalance = Math.max(0, total - currentUser.balance);

  // Balansla alış
  const handlePurchaseWithBalance = () => {
    if (!hasEnoughBalance || total <= 0) return;

    const newBalance = Number((currentUser.balance - total).toFixed(2));
    onUpdateProfile({ balance: newBalance });

    const keys = items.flatMap((item) =>
      Array.from({ length: item.quantity }).map(() => ({
        productName: item.product.name,
        key: `LUM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026`,
        downloadUrl: `https://lumora.ai/download/${item.product.category}/${item.product.id}-release.pkg`,
      }))
    );

    setPurchasedKeys(keys);
    setIsPurchased(true);

    // Save to Supabase user_library so it appears in "Kitabxanam" immediately
    (async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        const uid = authUser?.id || (currentUser.id && currentUser.id !== 'current_user' ? currentUser.id : null);
        if (uid) {
          const libraryRows = items.map((it) => ({
            user_id: uid,
            product_id: it.product.id,
          }));

          const { error } = await supabase.from('user_library').insert(libraryRows);
          if (error) {
            console.warn('user_library insertion note:', error.message);
          }
        }
      } catch (err) {
        console.warn('Error recording purchased products into user_library:', err);
      }
    })();

    onClearCart();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Səbət boş olduqda
  if (items.length === 0 && !isPurchased) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 flex flex-col items-center justify-center text-center space-y-4">
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center border shadow-sm ${
            isDark
              ? 'bg-white/5 border-white/10 text-white/50'
              : 'bg-white border-gray-200 text-gray-400'
          }`}
        >
          <ShoppingBag size={28} />
        </div>

        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold">Səbətiniz boşdur</h3>
          <p className="text-xs opacity-60 max-w-xs">
            Kataloqdan və ya endirimli bölmədən bəyəndiyiniz məhsulları səbətə əlavə edə bilərsiniz.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToCatalog}
          className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <span>Kataloqa Keç</span>
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  // ALIŞ UĞURLA TAMAMLANDI PƏNCƏRƏSİ
  if (isPurchased) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-4 px-3 sm:px-4 py-4">
        <div
          className={`p-6 rounded-[28px] border space-y-4 backdrop-blur-xl ${
            isDark
              ? 'bg-[#151720]/90 border-white/10 text-white'
              : 'bg-white border-gray-200 text-gray-950 shadow-sm'
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold">
                Alış Uğurla Tamamlandı
              </h3>
              <p className="text-xs opacity-60">
                Məbləğ balansınızdan çıxıldı. Lisenziya açarınız və yükləmə linkiniz hazırdır.
              </p>
            </div>
          </div>

          {/* Keys list */}
          <div className="space-y-3 pt-2">
            {purchasedKeys.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold truncate">
                    {item.productName}
                  </h4>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                    Aktiv Lisenziya
                  </span>
                </div>

                {/* Key block */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold opacity-60 flex items-center gap-1">
                    <Key size={11} /> Lisenziya Açarı:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={item.key}
                      className={`w-full px-3 py-1.5 rounded-xl border font-mono text-xs font-semibold ${
                        isDark
                          ? 'bg-black/40 border-white/10 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(item.key)}
                      className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === item.key ? 'Kopyalandı' : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Download Button */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => alert(`"${item.productName}" yükləməsi başladıldı.`)}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  >
                    <Download size={14} />
                    <span>Faylları İndi Yüklə</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.downloadUrl)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer"
                    title="Yükləmə linkini kopyala"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="opacity-70">
              Qalıq Balansınız: <span className="font-bold">{currentUser.balance.toFixed(2)} AZN</span>
            </span>
            <button
              type="button"
              onClick={() => setIsPurchased(false)}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-bold cursor-pointer"
            >
              Tamamla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 px-3 sm:px-4">
      {/* Səbət Başlığı */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-extrabold">Səbət</h3>
          <span
            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border ${
              isDark
                ? 'bg-white/10 border-white/15 text-white/80'
                : 'bg-gray-100 border-gray-300 text-gray-800'
            }`}
          >
            {items.reduce((acc, i) => acc + i.quantity, 0)}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearCart}
          className="text-xs opacity-60 hover:opacity-100 hover:underline cursor-pointer"
        >
          Səbəti təmizlə
        </button>
      </div>

      {/* Məhsulların Siyahısı - HomeView Dizaynına Uyğun */}
      <div className="space-y-3">
        {items.map(({ product, quantity }) => (
          <motion.div
            layout
            key={product.id}
            onClick={() => onOpenProduct(product)}
            className={`p-4 rounded-[26px] border backdrop-blur-xl transition-all cursor-pointer group flex items-center gap-3.5 shadow-sm ${
              isDark
                ? 'bg-[#151720]/80 hover:bg-[#1a1d28]/90 border-white/10 hover:border-cyan-500/40 text-white'
                : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-cyan-400 text-gray-950'
            }`}
          >
            {/* Şəkil */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-black/10 shrink-0 relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Eye size={16} />
              </div>
            </div>

            {/* Məlumat */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white/70'
                      : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  {product.subcategoryLabel}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold truncate group-hover:text-cyan-400 transition-colors">
                {product.name}
              </h4>
              <p className="text-[10px] opacity-65 truncate">
                {product.description}
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-xs sm:text-sm font-black text-cyan-500 dark:text-cyan-400">
                  {product.price} ₼
                </span>
                {product.oldPrice && (
                  <span className="text-[10px] line-through opacity-40">
                    {product.oldPrice} ₼
                  </span>
                )}
                <span className="text-[10px] text-cyan-400 font-semibold ml-auto hidden sm:inline">
                  Ətraflı baxmaq üçün toxunun →
                </span>
              </div>
            </div>

            {/* Say tənzimləmə və silmə */}
            <div
              className="flex flex-col items-end justify-between h-full space-y-2.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onRemoveItem(product.id)}
                className="p-1.5 rounded-xl opacity-60 hover:opacity-100 hover:text-rose-400 transition-all cursor-pointer"
                title="Sil"
              >
                <Trash2 size={15} />
              </button>

              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-100 border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, -1)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded cursor-pointer"
                >
                  <Minus size={11} />
                </button>
                <span className="text-xs font-bold min-w-4 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, 1)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* PROMO KOD BÖLMƏSİ - Sadə və zərif HomeView stili */}
      <div
        className={`p-4 rounded-[26px] border space-y-2 backdrop-blur-xl ${
          isDark
            ? 'bg-[#151720]/80 border-white/10 text-white'
            : 'bg-white border-gray-200 text-gray-950 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Tag size={14} className="text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            Promo Kod
          </h4>
        </div>

        {appliedPromo ? (
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border text-xs ${
              isDark
                ? 'bg-white/5 border-cyan-500/30 text-white'
                : 'bg-gray-50 border-cyan-400 text-gray-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-cyan-400" />
              <span className="font-bold">
                "{appliedPromo.code}" tətbiq edildi (-{appliedPromo.discountPercent}%)
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              className="p-1 rounded-lg opacity-60 hover:opacity-100 cursor-pointer"
              title="Ləğv et"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyPromo} className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo kod daxil edin (məs: LUMORA20)"
                className={`flex-1 px-3.5 py-2.5 rounded-2xl border text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  isDark
                    ? 'bg-white/5 border-white/15 text-white placeholder-white/40'
                    : 'bg-gray-50 border-gray-300 text-gray-950 placeholder-gray-400'
                }`}
              />
              <button
                type="submit"
                disabled={!promoInput.trim()}
                className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white font-bold text-xs cursor-pointer transition-all shadow-sm"
              >
                Tətbiq Et
              </button>
            </div>
            {promoError && (
              <p className="text-[10px] text-rose-400">{promoError}</p>
            )}
          </form>
        )}
      </div>

      {/* BALANS VƏ ÖDƏNİŞ XÜLASƏSİ - HomeView stili */}
      <div
        className={`p-5 rounded-[26px] border space-y-3.5 backdrop-blur-xl ${
          isDark
            ? 'bg-[#151720]/80 border-white/10 text-white'
            : 'bg-white border-gray-200 text-gray-950 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-75">
              Ödəniş & Balans
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">
              Balans: <span className="font-bold text-cyan-400">{currentUser.balance.toFixed(2)} ₼</span>
            </span>
            <button
              type="button"
              onClick={onOpenTopUp}
              className="px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1 border border-cyan-500/20"
            >
              <Plus size={10} />
              <span>Artır</span>
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between opacity-75">
            <span>Məhsulların qiyməti:</span>
            <span>{subtotal.toFixed(2)} ₼</span>
          </div>

          {appliedPromo && (
            <div className="flex justify-between text-cyan-400 font-semibold">
              <span>Promo Endirim (-{appliedPromo.discountPercent}%):</span>
              <span>-{promoDiscountAmount.toFixed(2)} ₼</span>
            </div>
          )}

          <div className="pt-2 border-t border-white/10 flex justify-between text-sm sm:text-base font-black">
            <span>Yekun Ödəniləcək:</span>
            <span className="text-cyan-500 text-lg sm:text-xl">{total.toFixed(2)} ₼</span>
          </div>
        </div>

        {/* Balans çatışmadıqda bildiriş */}
        {!hasEnoughBalance && (
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
              isDark
                ? 'bg-white/5 border-white/15 text-white/90'
                : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-cyan-400 shrink-0" />
              <span>
                Balansınız kifayət etmir (Çatışmayan: <b>{missingBalance.toFixed(2)} ₼</b>)
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenTopUp}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-sm cursor-pointer shrink-0"
            >
              Balansı Artır
            </button>
          </div>
        )}

        {/* Balansla Satın Al Düyməsi */}
        <button
          type="button"
          disabled={!hasEnoughBalance || total <= 0}
          onClick={handlePurchaseWithBalance}
          className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Sifarişi Təsdiqlə ({total.toFixed(2)} ₼)</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};

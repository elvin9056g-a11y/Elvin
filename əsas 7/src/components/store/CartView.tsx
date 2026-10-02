import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  AlertCircle,
  Eye,
  Info,
  RefreshCw,
  Ticket,
  Clock,
  User,
  Sparkles,
  Check,
  Percent,
} from 'lucide-react';
import { supabase, fetchAvailablePromocodesForUser } from '../../lib/supabase';
import { CartItem, StoreProduct, UserProfile, DbPromocode } from '../../types';
import { useTheme } from '../../context/ThemeContext';

/**
 * QAYDA:
 * `secret_content` heç vaxt səbət (Cart) səhifəsində göstərilmir.
 * O yalnız "Kitabxanam" (LibraryView) səhifəsində Supabase-dən çəkilərək göstərilir.
 * Ödəniş sistemi hazırda test mərhələsində olduğu üçün "Ödəniş et" düyməsi bildiriş pəncərəsi açır.
 */

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

  // Real Promokodlar State (Supabase promocodes cədvəlindən)
  const [availablePromos, setAvailablePromos] = useState<DbPromocode[]>([]);
  const [loadingPromos, setLoadingPromos] = useState<boolean>(true);

  // Promo kod tətbiqi state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
    isPersonal?: boolean;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Test mərhələsi bildiriş modalı state
  const [showTestNotice, setShowTestNotice] = useState(false);

  // Supabase promocodes cədvəlindən keçərli kodları çək:
  // is_active = true, expires_at > NOW() və ya null, used_count < usage_limit və ya null,
  // user_id ya null (hamı üçün), ya da hazırkı istifadəçi ID-si (şəxsi).
  const loadAvailablePromos = async () => {
    setLoadingPromos(true);
    try {
      const data = await fetchAvailablePromocodesForUser(currentUser.id);
      setAvailablePromos(data);
    } catch (err) {
      console.warn('Error fetching available promocodes:', err);
    } finally {
      setLoadingPromos(false);
    }
  };

  useEffect(() => {
    loadAvailablePromos();
  }, [currentUser.id]);

  // Siyahıdan birbaşa promokodu tətbiq etmək / ləğv etmək
  const handleSelectPromo = (promo: DbPromocode) => {
    if (appliedPromo?.code === promo.code) {
      // Artıq tətbiq olunubsa ləğv et
      setAppliedPromo(null);
      setPromoSuccessMsg(null);
      return;
    }

    setAppliedPromo({
      code: promo.code,
      discountPercent: Number(promo.discount_percent),
      isPersonal: Boolean(promo.user_id),
    });
    setPromoError(null);
    setPromoSuccessMsg(`"${promo.code}" promokodu uğurla tətbiq edildi (-${promo.discount_percent}%)`);
    setTimeout(() => setPromoSuccessMsg(null), 3500);
  };

  // Əl ilə promokod daxil edildikdə: Yalnız Supabase-dən yoxla (saxta kodlar qətiyyən yoxdur)
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoInput.trim().toUpperCase();
    if (!cleanCode) return;

    setValidatingPromo(true);
    setPromoError(null);
    setPromoSuccessMsg(null);

    try {
      const { data: dbPromo, error } = await supabase
        .from('promocodes')
        .select('*')
        .eq('code', cleanCode)
        .maybeSingle();

      if (error) {
        console.warn('Promocode database query error:', error);
      }

      if (!dbPromo) {
        setPromoError('Daxil etdiyiniz promokod mövcud deyil və ya yanlışdır.');
        return;
      }

      if (!dbPromo.is_active) {
        setPromoError('Bu promokod artıq deaktiv edilib.');
        return;
      }

      if (dbPromo.expires_at) {
        const expTime = new Date(dbPromo.expires_at).getTime();
        if (!isNaN(expTime) && expTime <= Date.now()) {
          setPromoError('Bu promokodun istifadə müddəti bitib.');
          return;
        }
      }

      if (
        typeof dbPromo.usage_limit === 'number' &&
        dbPromo.usage_limit > 0 &&
        (dbPromo.used_count || 0) >= dbPromo.usage_limit
      ) {
        setPromoError('Bu promokodun istifadə limiti dolub.');
        return;
      }

      if (dbPromo.user_id && dbPromo.user_id !== currentUser.id) {
        setPromoError('Bu promokod yalnız xüsusi istifadəçi üçün nəzərdə tutulub.');
        return;
      }

      setAppliedPromo({
        code: cleanCode,
        discountPercent: Number(dbPromo.discount_percent),
        isPersonal: Boolean(dbPromo.user_id),
      });
      setPromoError(null);
      setPromoInput('');
      setPromoSuccessMsg(`"${cleanCode}" promokodu uğurla tətbiq edildi (-${dbPromo.discount_percent}%)`);
      setTimeout(() => setPromoSuccessMsg(null), 3500);
    } catch (err: any) {
      console.warn('Promocode validation error:', err);
      setPromoError(err?.message || 'Promokod yoxlanılarkən xəta baş verdi.');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
    setPromoSuccessMsg(null);
  };

  const formatExpiry = (isoString?: string | null) => {
    if (!isoString) return null;
    try {
      const dt = new Date(isoString);
      if (isNaN(dt.getTime())) return null;
      return dt.toLocaleDateString('az-AZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  // Qiymət hesablamaları
  const getItemPrice = (p: StoreProduct) => {
    const isDisc = Boolean(
      p.is_discounted ||
      p.isDiscounted ||
      (p.discount_price !== null &&
        p.discount_price !== undefined &&
        Number(p.discount_price) < Number(p.price))
    );
    if (isDisc && p.discount_price !== null && p.discount_price !== undefined) {
      return Number(p.discount_price);
    }
    return typeof p.price === 'number' ? p.price : Number(p.price) || 0;
  };

  const subtotal = items.reduce(
    (sum, item) => sum + getItemPrice(item.product) * item.quantity,
    0
  );

  const promoDiscountAmount = appliedPromo
    ? (subtotal * appliedPromo.discountPercent) / 100
    : 0;

  const total = Math.max(0, subtotal - promoDiscountAmount);
  const hasEnoughBalance = currentUser.balance >= total;
  const missingBalance = Math.max(0, total - currentUser.balance);

  // Səbət boş olduqda
  if (items.length === 0) {
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
                {Boolean(
                  product.is_discounted ||
                  product.isDiscounted ||
                  (product.discount_price !== null &&
                    product.discount_price !== undefined &&
                    Number(product.discount_price) < Number(product.price))
                ) ? (
                  <>
                    <span className="text-xs sm:text-sm font-black text-red-500">
                      {product.discount_price !== null && product.discount_price !== undefined
                        ? product.discount_price
                        : product.price} ₼
                    </span>
                    <span className="text-[10px] line-through text-gray-500">
                      {product.price} ₼
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs sm:text-sm font-black text-cyan-500 dark:text-cyan-400">
                      {product.price} ₼
                    </span>
                    {product.oldPrice && (
                      <span className="text-[10px] line-through opacity-40">
                        {product.oldPrice} ₼
                      </span>
                    )}
                  </>
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

      {/* MÖVCUD REAL PROMOKODLAR BÖLMƏSİ (Supabase-dən çəkilmiş aktiv və şəxsi kodlar) */}
      <div
        className={`p-4 sm:p-5 rounded-[26px] border space-y-3.5 backdrop-blur-xl ${
          isDark
            ? 'bg-[#151720]/80 border-white/10 text-white'
            : 'bg-white border-gray-200 text-gray-950 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-400">
              <Ticket size={16} />
            </span>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                <span>Mövcud Promokodlar</span>
                {availablePromos.length > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {availablePromos.length}
                  </span>
                )}
              </h4>
              <p className="text-[10px] opacity-60">
                Sizin üçün aktiv olan xüsusi endirim kodları
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAvailablePromos}
            disabled={loadingPromos}
            className="p-1.5 rounded-xl opacity-60 hover:opacity-100 hover:bg-white/10 transition-colors cursor-pointer text-cyan-400"
            title="Yenilə"
          >
            <RefreshCw size={14} className={loadingPromos ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Real Promokodlar Siyahısı */}
        {loadingPromos ? (
          <div className="py-4 flex items-center justify-center gap-2 text-xs opacity-60">
            <RefreshCw size={14} className="animate-spin text-cyan-400" />
            <span>Mövcud promokodlar yoxlanılır...</span>
          </div>
        ) : availablePromos.length === 0 ? (
          <div className="py-3 px-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
            <p className="text-xs opacity-70">
              Hazırda aktiv ümumi promokod yoxdur.
            </p>
            <p className="text-[10px] opacity-40">
              Əgər şəxsi promokodunuz varsa, aşağıdakı xanaya daxil edə bilərsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availablePromos.map((promo) => {
              const isApplied = appliedPromo?.code === promo.code;
              const expiryFormatted = formatExpiry(promo.expires_at);

              return (
                <div
                  key={promo.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isApplied
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : isDark
                      ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-xs sm:text-sm tracking-wider text-cyan-400">
                          {promo.code}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <Percent size={10} />
                          <span>{promo.discount_percent}% Endirim</span>
                        </span>
                        {promo.user_id && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                            <User size={9} />
                            <span>Şəxsi</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-[10px] opacity-60">
                        {expiryFormatted ? (
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            <span>Son tarix: {expiryFormatted}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-cyan-400/90 font-medium">
                            <Sparkles size={10} />
                            <span>Müddətsiz</span>
                          </span>
                        )}
                        {typeof promo.usage_limit === 'number' && promo.usage_limit > 0 && (
                          <span className="opacity-60">• Limit: {promo.used_count || 0}/{promo.usage_limit}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1 border-t border-white/5">
                    {isApplied ? (
                      <button
                        type="button"
                        onClick={() => handleSelectPromo(promo)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-rose-500/20 border border-emerald-500/40 hover:border-rose-500/40 text-emerald-300 hover:text-rose-300 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer group"
                      >
                        <Check size={12} className="group-hover:hidden" />
                        <X size={12} className="hidden group-hover:inline" />
                        <span className="group-hover:hidden">Tətbiq edilib</span>
                        <span className="hidden group-hover:inline">Ləğv et</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectPromo(promo)}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-[11px] flex items-center gap-1 shadow-sm shadow-cyan-500/20 transition-all cursor-pointer"
                      >
                        <span>Tətbiq et</span>
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Əl ilə promokod daxil etmə forması (Şəxsi və ya siyahıda olmayan kodlar üçün) */}
        <div className="pt-2.5 border-t border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold opacity-75">
              Başqa Promokodunuz var?
            </span>
            {appliedPromo && (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Aktiv: {appliedPromo.code} (-{appliedPromo.discountPercent}%)</span>
              </span>
            )}
          </div>

          <form onSubmit={handleApplyPromo} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Kodu daxil edin..."
                className={`flex-1 px-3.5 py-2.5 rounded-2xl border text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  isDark
                    ? 'bg-white/5 border-white/15 text-white placeholder-white/40'
                    : 'bg-gray-50 border-gray-300 text-gray-950 placeholder-gray-400'
                }`}
              />
              <button
                type="submit"
                disabled={!promoInput.trim() || validatingPromo}
                className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-gray-950 font-bold text-xs cursor-pointer transition-all shadow-sm flex items-center gap-1.5 shrink-0"
              >
                {validatingPromo ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Yoxlanılır...</span>
                  </>
                ) : (
                  <span>Tətbiq Et</span>
                )}
              </button>
            </div>
            {promoError && (
              <p className="text-[10px] text-rose-400 flex items-center gap-1">
                <AlertCircle size={11} />
                <span>{promoError}</span>
              </p>
            )}
            {promoSuccessMsg && (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={11} />
                <span>{promoSuccessMsg}</span>
              </p>
            )}
          </form>
        </div>
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
            <div className="flex justify-between text-emerald-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Ticket size={13} />
                <span>Promo Endirim (-{appliedPromo.discountPercent}%):</span>
              </span>
              <span>-{promoDiscountAmount.toFixed(2)} ₼</span>
            </div>
          )}

          <div className="pt-2.5 border-t border-white/10 flex justify-between items-center text-sm sm:text-base font-black">
            <div className="flex flex-col">
              <span>Yekun Ödəniləcək:</span>
              {appliedPromo && (
                <span className="text-[10px] font-semibold text-emerald-400">
                  "{appliedPromo.code}" endirimi tətbiq olunub
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              {appliedPromo && (
                <span className="text-xs sm:text-sm line-through text-gray-400 opacity-60 font-semibold">
                  {subtotal.toFixed(2)} ₼
                </span>
              )}
              <span
                className={`text-lg sm:text-xl font-black ${
                  appliedPromo ? 'text-emerald-400' : 'text-cyan-500'
                }`}
              >
                {total.toFixed(2)} ₼
              </span>
            </div>
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

        {/* Ödəniş et (Checkout) Düyməsi */}
        <button
          type="button"
          onClick={() => setShowTestNotice(true)}
          className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <span>Ödəniş et ({total.toFixed(2)} ₼)</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Test Mərhələsi Bildiriş Modalı */}
      <AnimatePresence>
        {showTestNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Arxa fon (Backdrop) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTestNotice(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Modal Pəncərəsi */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-md p-6 rounded-[28px] border shadow-2xl backdrop-blur-2xl z-10 space-y-4 ${
                isDark
                  ? 'bg-[#151720]/95 border-white/15 text-white'
                  : 'bg-white border-gray-200 text-gray-950 shadow-xl'
              }`}
            >
              {/* Bağlamaq düyməsi */}
              <button
                type="button"
                onClick={() => setShowTestNotice(false)}
                className="absolute top-4 right-4 p-2 rounded-xl opacity-60 hover:opacity-100 hover:bg-white/10 transition-colors cursor-pointer"
                title="Bağla"
              >
                <X size={18} />
              </button>

              {/* İkon və Başlıq */}
              <div className="flex items-start gap-3.5 pr-6">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                  <Info size={22} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    Məlumat
                  </span>
                  <h3 className="text-base font-extrabold">
                    Test Mərhələsi
                  </h3>
                </div>
              </div>

              {/* Bildiriş Mətni */}
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed font-medium ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white/90'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              >
                Saytımız hazırda test mərhələsindədir. Ödəniş sistemi hələlik aktiv deyil. Anlayışınız üçün təşəkkürlər!
              </div>

              {/* Təsdiq Düyməsi */}
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTestNotice(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  Anladım
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

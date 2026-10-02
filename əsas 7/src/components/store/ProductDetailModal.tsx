import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Star,
  Heart,
  MessageSquare,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Send,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { StoreProduct, ProductReview, UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const isUuid = (id?: string | null): boolean =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

interface ProductDetailModalProps {
  product: StoreProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: StoreProduct, quantity: number) => void;
  onToggleLike: (productId: string) => void;
  onAddReview: (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => void;
  currentUser?: UserProfile | null;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleLike,
  onAddReview,
  currentUser,
}) => {
  const { isDark } = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // New review form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Supabase reviews & purchase validation state
  const [dbReviews, setDbReviews] = useState<ProductReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const isDiscounted = Boolean(
    product?.is_discounted ||
    product?.isDiscounted ||
    (product?.discount_price !== null &&
      product?.discount_price !== undefined &&
      Number(product?.discount_price) < Number(product?.price))
  );

  const displayOriginalPrice = product
    ? typeof product.price === 'number'
      ? product.price
      : Number(product.price) || 0
    : 0;

  const displayDiscountPrice = product
    ? product.discount_price !== null && product.discount_price !== undefined
      ? Number(product.discount_price)
      : product.oldPrice && product.price < product.oldPrice
      ? product.price
      : displayOriginalPrice
    : 0;

  const effectiveUnitPrice = isDiscounted ? displayDiscountPrice : displayOriginalPrice;

  // Fetch reviews from Supabase joined with profiles
  const fetchProductReviews = async (productId: string) => {
    setLoadingReviews(true);
    try {
      const { data: revData, error: revErr } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (revErr) {
        console.warn('Error fetching reviews:', revErr.message);
        return;
      }

      if (!revData || revData.length === 0) {
        setDbReviews([]);
        return;
      }

      const userIds = [...new Set(revData.map((r: any) => r.user_id).filter(Boolean))];
      const profilesMap = new Map<string, any>();

      if (userIds.length > 0) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        (profData || []).forEach((p: any) => {
          profilesMap.set(p.id, p);
        });
      }

      const mapped: ProductReview[] = revData.map((r: any) => {
        const prof = profilesMap.get(r.user_id);
        const name = prof
          ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || prof.email || 'İstifadəçi'
          : 'İstifadəçi';

        return {
          id: String(r.id),
          userName: name,
          userAvatar: prof?.avatar || undefined,
          rating: typeof r.rating === 'number' ? r.rating : 5,
          comment: r.comment || '',
          date: r.created_at
            ? new Date(r.created_at).toLocaleDateString('az-AZ', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Yeni',
        };
      });

      setDbReviews(mapped);
    } catch (err) {
      console.warn('Error fetching product reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Check if active user has purchased this product via user_library
  const resolveUserAndCheckPurchase = async (productId: string) => {
    setCheckingPurchase(true);
    let uid: string | null = null;
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser?.id) uid = authUser.id;
    } catch {}
    if (!uid && currentUser?.id && isUuid(currentUser.id)) {
      uid = currentUser.id;
    }

    setResolvedUserId(uid);

    if (!uid) {
      setHasPurchased(false);
      setCheckingPurchase(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_library')
        .select('id')
        .eq('user_id', uid)
        .eq('product_id', productId)
        .limit(1);

      if (error) {
        console.warn('Error checking user_library:', error.message);
        setHasPurchased(false);
      } else {
        setHasPurchased(Boolean(data && data.length > 0));
      }
    } catch (err) {
      console.warn('Error checking purchase:', err);
      setHasPurchased(false);
    } finally {
      setCheckingPurchase(false);
    }
  };

  // Initialize reviews and purchase verification when modal opens
  useEffect(() => {
    if (isOpen && product?.id) {
      fetchProductReviews(product.id);
      resolveUserAndCheckPurchase(product.id);
      if (currentUser?.firstName) {
        setReviewName(`${currentUser.firstName} ${currentUser.lastName || ''}`.trim());
      }
    } else {
      setDbReviews([]);
      setHasPurchased(null);
      setResolvedUserId(null);
    }
  }, [isOpen, product?.id, currentUser?.id]);

  // Safely parse JSON parameters from DB or fallback specs
  const resolvedParameters = useMemo(() => {
    if (!product) return {};
    let pObj: Record<string, any> = {};
    if (product.parameters) {
      if (typeof product.parameters === 'object') {
        pObj = { ...product.parameters };
      } else if (typeof product.parameters === 'string') {
        try {
          pObj = JSON.parse(product.parameters);
        } catch {
          pObj = {};
        }
      }
    }
    if (product.specs && typeof product.specs === 'object') {
      pObj = { ...product.specs, ...pObj };
    }
    return pObj;
  }, [product?.parameters, product?.specs]);

  if (!isOpen || !product) return null;

  // Active reviews list
  const activeReviews = dbReviews.length > 0 ? dbReviews : product.reviews || [];

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim() || submittingReview || !product) return;

    let uid = resolvedUserId;
    if (!uid) {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser?.id) uid = authUser.id;
      } catch {}
      if (!uid && currentUser?.id && isUuid(currentUser.id)) {
        uid = currentUser.id;
      }
    }

    if (!uid) {
      alert('Rəy bildirmək üçün daxil olmalısınız.');
      return;
    }

    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert([
        {
          user_id: uid,
          product_id: product.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        },
      ]);

      if (error) {
        alert(`Xəta: ${error.message}`);
        return;
      }

      const authorName = reviewName.trim() || currentUser?.firstName || 'İstifadəçi';
      onAddReview(product.id, {
        userName: authorName,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewComment('');
      setShowReviewSuccess(true);
      setTimeout(() => setShowReviewSuccess(false), 2500);

      // Refresh reviews list from Supabase immediately
      await fetchProductReviews(product.id);
    } catch (err: any) {
      console.warn('Error submitting review:', err);
      alert(`Xəta baş verdi: ${err.message || err}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25 }}
          className={`relative w-full max-w-xl max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col z-10 backdrop-blur-2xl ${
            isDark
              ? 'bg-[#12141c]/95 border-white/15 text-white'
              : 'bg-white/95 border-gray-200 text-gray-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
          }`}
        >
          {/* Header Close & Like */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleLike(product.id)}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer shadow-md"
              aria-label="Bəyən"
            >
              <Heart
                size={17}
                className={`transition-colors ${
                  product.isLiked
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-white hover:text-rose-400'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer shadow-md"
              aria-label="Bağla"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
            {/* Top Product Hero with image */}
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black/10">
              <img
                src={
                  product.image_url ||
                  product.image ||
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'
                }
                alt={product.title || product.name}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
                }}
              />

              {/* Endirim Teqi: "🔥 Endirim" etiketi */}
              {isDiscounted && (
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black tracking-wide shadow-md flex items-center gap-1.5">
                  <span>🔥 Endirim</span>
                  {product.discountPercent ? <span>(-{product.discountPercent}%)</span> : null}
                </div>
              )}

              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-white">
                {product.subcategoryLabel}
              </div>
            </div>

            {/* Title & Rating */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold">
                  {product.title || product.name}
                </h3>

                {/* Price Display */}
                {isDiscounted ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black text-red-500">
                      {displayDiscountPrice === 0 ? '0 ₼' : `${displayDiscountPrice} ₼`}
                    </span>
                    <span className="text-sm line-through text-gray-500">
                      {displayOriginalPrice} ₼
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black text-cyan-500">
                      {displayOriginalPrice === 0 ? '0 ₼' : `${displayOriginalPrice} ₼`}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-4 text-xs font-semibold opacity-85">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={14} className="fill-amber-400" />
                  <span>{product.rating.toFixed(1)} ulduz</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare size={14} />
                  <span>{product.reviewsCount} yorum</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={14} className="text-rose-500 fill-rose-500" />
                  <span>{product.likesCount} bəyənmə</span>
                </div>
              </div>
            </div>

            {/* NƏ ÜÇÜN İSTİFADƏ OLUNUR BLOKU */}
            <div
              className={`p-4 rounded-2xl border ${
                isDark
                  ? 'bg-cyan-950/20 border-cyan-800/30 text-white'
                  : 'bg-cyan-50/80 border-cyan-200 text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h5 className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Nə üçün istifadə olunur?
                </h5>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                {product.description}
              </p>
              {product.fullDetails && product.fullDetails !== product.description && (
                <p className="text-xs sm:text-sm leading-relaxed opacity-75 mt-2 border-t border-cyan-500/20 pt-2">
                  {product.fullDetails}
                </p>
              )}
            </div>

            {/* Tabs for Details vs Reviews */}
            <div className="flex items-center border-b border-white/10 dark:border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-cyan-500 text-cyan-500'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                Xüsusiyyətlər
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'border-cyan-500 text-cyan-500'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                Yorumlar ({activeReviews.length})
              </button>
            </div>

            {/* TAB 1: DETAILS & SPECS */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                {/* Tech Specs Table from parameters JSON or specs */}
                {Object.keys(resolvedParameters).length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-xs font-bold uppercase tracking-wider opacity-60">
                      Texniki Parametrlər
                    </h6>
                    <div
                      className={`divide-y rounded-2xl border overflow-hidden text-xs ${
                        isDark
                          ? 'divide-white/10 border-white/10 bg-white/5'
                          : 'divide-gray-200 border-gray-200 bg-gray-50'
                      }`}
                    >
                      {Object.entries(resolvedParameters).map(([key, val]) => (
                        <div key={key} className="p-2.5 sm:p-3 flex justify-between items-center">
                          <span className="opacity-60">{key}</span>
                          <span className="font-semibold">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* TAB 2: YORUMLAR (REVIEWS) */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Yorum Əlavə Et Bölməsi: Satınalma Yoxlaması */}
                {checkingPurchase ? (
                  <div className="py-4 text-center text-xs opacity-50 flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-cyan-400" />
                    <span>Satınalma hüququ yoxlanılır...</span>
                  </div>
                ) : hasPurchased ? (
                  /* Məhsul kitabxanasında olduqda aktiv rəy formu */
                  <form
                    onSubmit={handleReviewSubmit}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <h6 className="text-xs font-bold uppercase tracking-wider text-cyan-500">
                      Fikir bildirin / Yorum yazın
                    </h6>

                    {/* Star Picker */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-70">Reytinqiniz:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 cursor-pointer transition-transform hover:scale-120"
                          >
                            <Star
                              size={16}
                              className={
                                star <= reviewRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-400'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="Adınız (məs: Elvin)"
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                        isDark
                          ? 'bg-black/30 border-white/15 text-white'
                          : 'bg-white border-gray-300 text-gray-950'
                      }`}
                    />

                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Məhsul haqqında rəyiniz..."
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                        isDark
                          ? 'bg-black/30 border-white/15 text-white'
                          : 'bg-white border-gray-300 text-gray-950'
                      }`}
                    />

                    <div className="flex items-center justify-between">
                      {showReviewSuccess ? (
                        <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                          <Check size={14} /> Yorumunuz əlavə olundu!
                        </span>
                      ) : (
                        <span className="text-[10px] opacity-60">Real alıcı rəyləri</span>
                      )}

                      <button
                        type="submit"
                        disabled={!reviewComment.trim() || submittingReview}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        {submittingReview ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" /> Göndərilir...
                          </>
                        ) : (
                          <>
                            <Send size={12} /> Yorumu Göndər
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Məhsul kitabxanasında yoxdursa: form gizlədilir və xəbərdarlıq yazısı çıxır */
                  <div
                    className={`p-4 rounded-2xl border text-center space-y-1.5 ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-400">
                      <AlertCircle size={15} />
                      <span>Rəy yazmaq üçün əvvəlcə bu məhsulu kitabxananıza əlavə etməlisiniz</span>
                    </div>
                    <p className="text-[11px] opacity-60">
                      Yalnız məhsulu əldə etmiş real müştərilər rəy və qiymətləndirmə yaza bilərlər.
                    </p>
                  </div>
                )}

                {/* Yorumlar Siyahısı */}
                <div className="space-y-2.5">
                  {loadingReviews ? (
                    <div className="py-8 flex flex-col items-center justify-center text-xs opacity-60 gap-2">
                      <RefreshCw size={18} className="animate-spin text-cyan-400" />
                      <span>Rəylər bazadan yüklənir...</span>
                    </div>
                  ) : activeReviews.length > 0 ? (
                    activeReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className={`p-3 rounded-2xl border space-y-1 ${
                          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                              {rev.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold">{rev.userName}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                className={
                                  i < rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-400 opacity-40'
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs opacity-85 pl-8 leading-relaxed">
                          {rev.comment}
                        </p>

                        <div className="text-[9px] opacity-50 pl-8 pt-0.5">
                          {rev.date}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs opacity-60">
                      Hələlik bu məhsula şərh yazılmayıb. İlk şərhi siz yazın!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Quantity & Add To Cart */}
          <div
            className={`p-4 border-t flex items-center justify-between gap-3 ${
              isDark ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-gray-50'
            }`}
          >
            {/* Quantity Stepper */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border ${
                isDark ? 'bg-white/5 border-white/15' : 'bg-white border-gray-300'
              }`}
            >
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Minus size={13} />
              </button>
              <span className="text-xs font-black min-w-5 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Səbətə at / Əldə et düyməsi */}
            <button
              type="button"
              onClick={() => {
                onAddToCart(product, quantity);
                onClose();
              }}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <ShoppingBag size={16} />
              <span>
                {effectiveUnitPrice === 0
                  ? 'Əldə et'
                  : `Səbətə at (${(effectiveUnitPrice * quantity).toFixed(0)} ₼)`}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

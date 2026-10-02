import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Sparkles,
  Search,
  X,
  Package,
  ShoppingBag,
  RefreshCw,
  Flame,
  Tag,
} from 'lucide-react';
import { StoreAdBanner, StoreProduct } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { ProductCard } from './ProductCard';

interface CampaignViewProps {
  banner: StoreAdBanner;
  onBack: () => void;
  onSelectProduct: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct, quantity?: number, event?: React.MouseEvent) => void;
  onToggleLike: (productId: string, event: React.MouseEvent) => void;
  allStoreProducts: StoreProduct[];
  cartCount: number;
  onOpenCart: () => void;
}

export const CampaignView: React.FC<CampaignViewProps> = ({
  banner,
  onBack,
  onSelectProduct,
  onAddToCart,
  onToggleLike,
  allStoreProducts,
  cartCount,
  onOpenCart,
}) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignProducts, setCampaignProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch campaign products from Supabase product_ad_items joined with products table
  useEffect(() => {
    let isMounted = true;

    async function loadCampaignProducts() {
      setLoading(true);
      try {
        // Query Supabase directly: product_ad_items for this specific ad
        const { data, error } = await supabase
          .from('product_ad_items')
          .select('product_id, products(*)')
          .eq('ad_id', banner.id);

        if (!error && data && data.length > 0) {
          const fetchedItems: StoreProduct[] = [];
          const likedRaw = localStorage.getItem('lumora_product_likes');
          const likedIds: string[] = likedRaw ? JSON.parse(likedRaw) : [];

          data.forEach((row: any) => {
            const p = Array.isArray(row.products) ? row.products[0] : row.products;
            if (!p) return;

            const prodPrice = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
            const imgUrl =
              p.image_url ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';

            fetchedItems.push({
              id: String(p.id),
              name: p.title || 'Məhsul',
              title: p.title || 'Məhsul',
              category: p.category_id || 'all',
              category_id: p.category_id || null,
              subcategory: p.category_id || 'all',
              subcategoryLabel: 'Kampaniya Məhsulu',
              image: imgUrl,
              image_url: p.image_url || imgUrl,
              description: p.description || '',
              fullDetails: p.description || '',
              price: prodPrice,
              oldPrice: p.old_price || undefined,
              discountPercent: p.discount_percentage || (prodPrice === 0 ? 100 : undefined),
              rating: typeof p.rating === 'number' ? p.rating : 5.0,
              reviewsCount: p.reviews_count || 0,
              likesCount: likedIds.includes(String(p.id)) ? 2 : 1,
              isLiked: likedIds.includes(String(p.id)),
              inStock: true,
              reviews: [],
              specs: p.parameters || {},
              parameters: p.parameters || {},
              isDiscounted: Boolean(
                (p.discount_percentage && p.discount_percentage > 0) || prodPrice === 0
              ),
              secret_content: p.secret_content || null,
            });
          });

          if (isMounted) {
            setCampaignProducts(fetchedItems);
            setLoading(false);
            return;
          }
        }

        // Fallback: match by banner.productIds from allStoreProducts state
        if (banner.productIds && banner.productIds.length > 0) {
          const matched = allStoreProducts.filter((p) => banner.productIds?.includes(p.id));
          if (isMounted) {
            setCampaignProducts(matched);
            setLoading(false);
            return;
          }
        }

        if (isMounted) {
          setCampaignProducts([]);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Error fetching campaign products:', err);
        // Fallback
        if (banner.productIds && banner.productIds.length > 0) {
          const matched = allStoreProducts.filter((p) => banner.productIds?.includes(p.id));
          if (isMounted) setCampaignProducts(matched);
        }
        if (isMounted) setLoading(false);
      }
    }

    loadCampaignProducts();

    return () => {
      isMounted = false;
    };
  }, [banner.id, banner.productIds, allStoreProducts]);

  // Filter products by in-page search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return campaignProducts;
    const q = searchQuery.toLowerCase();
    return campaignProducts.filter((p) => {
      const titleStr = (p.title || p.name || '').toLowerCase();
      const descStr = (p.description || '').toLowerCase();
      return titleStr.includes(q) || descStr.includes(q);
    });
  }, [campaignProducts, searchQuery]);

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-3">
        {/* Geri Düyməsi */}
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold backdrop-blur-md transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
              : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900 shadow-sm'
          }`}
        >
          <ArrowLeft size={16} />
          <span>Geri qayıt</span>
        </button>

        {/* Kampaniya Status Nişanı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold shadow-sm">
          <Sparkles size={13} className="text-cyan-400 animate-pulse" />
          <span>Xüsusi Kampaniya</span>
        </div>

        {/* Səbət Düyməsi */}
        <button
          type="button"
          onClick={onOpenCart}
          className={`relative p-2.5 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
              : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900 shadow-sm'
          }`}
          aria-label="Səbətə bax"
        >
          <ShoppingBag size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. REKLAMIN ŞƏKLİ (BANNER) VƏ BAŞLIĞI - HERO SECTION */}
      <section className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/15 group">
        {/* Aspect Ratio 2.4 : 1 container matching store banner proportions */}
        <div className="relative w-full aspect-[2.4/1] min-h-[170px] sm:min-h-[220px] overflow-hidden bg-black">
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover object-center transform scale-102 group-hover:scale-100 transition-transform duration-700"
          />

          {/* Qradiyent Örtük */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/95 via-gray-950/60 to-transparent" />

          {/* Banner Daxili Məzmun */}
          <div className="absolute inset-0 p-4 sm:p-7 flex flex-col justify-between z-10">
            {/* Yuxarı teq */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-black tracking-wider text-white border border-white/25 shadow-sm uppercase">
                <Sparkles size={12} className="text-amber-300" />
                {banner.tag || 'Reklam Kampaniyası'}
              </span>

              <span className="px-2.5 py-1 rounded-full bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-[10px] sm:text-xs font-mono font-bold backdrop-blur-md">
                {campaignProducts.length} Məhsul
              </span>
            </div>

            {/* Mərkəzi Başlıq */}
            <div className="space-y-1 sm:space-y-2 max-w-[90%] sm:max-w-[80%]">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-lg">
                {banner.title}
              </h1>
              {banner.subtitle && (
                <p className="text-xs sm:text-sm text-white/85 line-clamp-2 leading-relaxed">
                  {banner.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. AXTARIŞ PANELİ (KAMPANİYA MƏHSULLARI ÜÇÜN) */}
      {campaignProducts.length > 2 && (
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Bu kampaniyadakı məhsulların adını axtar..."
            className={`w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs sm:text-sm font-medium border backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                : 'bg-white border-gray-200 text-gray-950 placeholder-gray-400 shadow-sm'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* 4. MƏHSULLAR BAŞLIĞI VƏ SAYĞAC */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Package size={16} />
          </span>
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
            Kampaniyaya Daxil Olan Məhsullar
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
          {filteredProducts.length} ədəd
        </span>
      </div>

      {/* 5. MƏHSULLARIN DÜZÜLÜŞÜ: QƏTİ TƏLƏB - YAN-YANA MÜTLƏQ 2 ƏDƏD (GRID-COLS-2) */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-white/40 text-xs">
          <RefreshCw size={24} className="animate-spin text-cyan-400" />
          <span>Kampaniya məhsulları yüklənir...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          className={`p-12 rounded-3xl border text-center space-y-3 ${
            isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <Package size={26} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {searchQuery ? 'Axtarışa uyğun məhsul tapılmadı' : 'Bu kampaniyada hələ məhsul yoxdur'}
            </h3>
            <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Zəhmət olmasa axtarış sorğusunu dəyişin və ya filtri sıfırlayın.'
                : 'Tezliklə bu reklam üçün xüsusi məhsullar əlavə olunacaq.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-gray-950 font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            Mağazaya Qayıt
          </button>
        </div>
      ) : (
        /* STRICT REQUIREMENT: ekranda mütləq yan-yana 2 ədəd (grid-cols-2) olmaqla aşağıya doğru sıralansın */
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              mode="discount"
              onSelect={(p) => onSelectProduct(p)}
              onAddToCart={(p, e) => onAddToCart(p, 1, e)}
              onToggleLike={(pId, e) => onToggleLike(pId, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
